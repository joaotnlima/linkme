import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, gte, lt, sql, count } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { tenantTag } from "@/lib/tenant";
import type { Feed, Link, Post, Settings } from "@/lib/db/schema";

const { settings, feeds, linksTable, posts, clicks } = schema;

// `cache()` dedupes per request: the public page calls these in both
// generateMetadata and the component — without it that's double the queries.
// One settings row per tenant, keyed by tenantId.
export const getSettings = cache(async (tenantId: string) => {
  const db = await getDb();
  const row = await db.query.settings.findFirst({ where: eq(settings.tenantId, tenantId) });
  if (row) return row;
  await db.insert(settings).values({ tenantId }).onConflictDoNothing();
  return (await db.query.settings.findFirst({ where: eq(settings.tenantId, tenantId) }))!;
});

export type PublicPageData = { settings: Settings; feeds: Feed[]; links: Link[]; posts: Post[] };

// The raw DB read, in display order. Every select is scoped to the tenant in
// its WHERE clause (never fetch-then-filter), which is also what keeps the
// per-tenant cache entries below correct.
async function readPublicPage(tenantId: string): Promise<PublicPageData> {
  const db = await getDb();
  const [s, feedRows, linkRows, postRows] = await Promise.all([
    getSettings(tenantId),
    db.select().from(feeds).where(and(eq(feeds.tenantId, tenantId), eq(feeds.enabled, true))).orderBy(asc(feeds.position)),
    db.select().from(linksTable).where(and(eq(linksTable.tenantId, tenantId), eq(linksTable.enabled, true))).orderBy(asc(linksTable.position)),
    db.select().from(posts).where(and(eq(posts.tenantId, tenantId), eq(posts.enabled, true))).orderBy(asc(posts.position), desc(posts.publishedAt)),
  ]);
  return { settings: s, feeds: feedRows, links: linkRows, posts: postRows };
}

// Next's Data Cache serializes through JSON, so Date columns come back as
// strings. Re-hydrate the timestamps the render touches (idempotent: `new Date`
// of an existing Date is still that instant). Keeps the cached payload a faithful
// `PublicPageData` for consumers.
export function hydrate(d: PublicPageData): PublicPageData {
  return {
    settings: { ...d.settings, updatedAt: new Date(d.settings.updatedAt) },
    feeds: d.feeds,
    links: d.links.map((l) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) })),
    posts: d.posts.map((p) => ({ ...p, publishedAt: p.publishedAt ? new Date(p.publishedAt) : null, createdAt: new Date(p.createdAt) })),
  };
}

/**
 * Everything the public page needs, served from the Data Cache so a normal visit
 * never touches the DB. The entry is keyed and tagged per tenant: an owner edit
 * calls `revalidateTag(tenantTag(id))` (see `lib/actions.ts`) and only that
 * tenant's page is recomputed on its next request. `cache()` dedupes the two
 * reads (generateMetadata + the page body) within a single request.
 */
export const getPublicPage = cache(async (tenantId: string): Promise<PublicPageData> => {
  const read = unstable_cache(() => readPublicPage(tenantId), ["public-page", tenantId], {
    tags: [tenantTag(tenantId)],
  });
  return hydrate(await read());
});

export async function getAdminData(tenantId: string) {
  const db = await getDb();
  const [s, feedRows, linkRows, postRows, clickCounts] = await Promise.all([
    getSettings(tenantId),
    db.select().from(feeds).where(eq(feeds.tenantId, tenantId)).orderBy(asc(feeds.position)),
    db.select().from(linksTable).where(eq(linksTable.tenantId, tenantId)).orderBy(asc(linksTable.position)),
    db.select().from(posts).where(eq(posts.tenantId, tenantId)).orderBy(asc(posts.position), desc(posts.publishedAt)),
    db.select({ linkId: clicks.linkId, n: count() }).from(clicks).where(eq(clicks.tenantId, tenantId)).groupBy(clicks.linkId),
  ]);
  const clicksByLink = new Map(clickCounts.map((c) => [c.linkId, Number(c.n)]));
  return { settings: s, feeds: feedRows, links: linkRows, posts: postRows, clicksByLink };
}

export async function resolveSlug(tenantId: string, slug: string) {
  const db = await getDb();
  return db.query.linksTable.findFirst({
    where: and(eq(linksTable.tenantId, tenantId), eq(linksTable.slug, slug), eq(linksTable.enabled, true)),
    columns: { id: true, url: true },
  });
}

export async function recordClick(tenantId: string, linkId: string) {
  const db = await getDb();
  await db.insert(clicks).values({ tenantId, linkId });
}

export type Range = "7d" | "30d" | "90d";

export async function getStats(tenantId: string, range: Range, day?: string | null) {
  const db = await getDb();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);
  const tz = "Europe/Lisbon";
  const forTenant = eq(clicks.tenantId, tenantId);
  // The chart series always spans the full range so any day can be picked.
  const perDay = await db
    .select({ day: sql<string>`to_char(${clicks.ts} at time zone ${tz}, 'YYYY-MM-DD')`, n: count() })
    .from(clicks)
    .where(and(forTenant, gte(clicks.ts, since)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  // Total + per-link honor the selected day when one is picked, else the range.
  const scope = day
    ? and(forTenant, sql`to_char(${clicks.ts} at time zone ${tz}, 'YYYY-MM-DD') = ${day}`)
    : and(forTenant, gte(clicks.ts, since));
  const [totalRow] = await db.select({ n: count() }).from(clicks).where(scope);
  const [prevRow] = day
    ? [undefined]
    : await db.select({ n: count() }).from(clicks).where(and(forTenant, gte(clicks.ts, prevSince), lt(clicks.ts, since)));
  const perLink = await db
    .select({ linkId: clicks.linkId, title: linksTable.title, iconUrl: linksTable.iconUrl, iconEmoji: linksTable.iconEmoji, n: count() })
    .from(clicks)
    .innerJoin(linksTable, eq(linksTable.id, clicks.linkId))
    .where(scope)
    .groupBy(clicks.linkId, linksTable.title, linksTable.iconUrl, linksTable.iconEmoji)
    .orderBy(desc(count()));
  // Zero-fill days in the owner's time zone.
  const byDay = new Map(perDay.map((d) => [d.day, Number(d.n)]));
  const series: { day: string; n: number }[] = [];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  for (let i = days - 1; i >= 0; i--) {
    const d = fmt.format(new Date(Date.now() - i * 86_400_000));
    series.push({ day: d, n: byDay.get(d) ?? 0 });
  }
  const total = Number(totalRow?.n ?? 0);
  return { days, day: day ?? null, total, prev: day ? null : Number(prevRow?.n ?? 0), series, perLink: perLink.map((r) => ({ ...r, n: Number(r.n) })) };
}
