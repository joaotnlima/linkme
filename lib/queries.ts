import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gte, lt, sql, count } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const { settings, feeds, linksTable, posts, clicks } = schema;

// `cache()` dedupes per request: the public page calls these in both
// generateMetadata and the component — without it that's double the queries.
export const getSettings = cache(async () => {
  const db = await getDb();
  const row = await db.query.settings.findFirst({ where: eq(settings.id, 1) });
  if (row) return row;
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  return (await db.query.settings.findFirst({ where: eq(settings.id, 1) }))!;
});

/** Everything the public page needs, in display order. */
export const getPublicPage = cache(async () => {
  const db = await getDb();
  const [s, feedRows, linkRows, postRows] = await Promise.all([
    getSettings(),
    db.select().from(feeds).where(eq(feeds.enabled, true)).orderBy(asc(feeds.position)),
    db.select().from(linksTable).where(eq(linksTable.enabled, true)).orderBy(asc(linksTable.position)),
    db.select().from(posts).where(eq(posts.enabled, true)).orderBy(asc(posts.position), desc(posts.publishedAt)),
  ]);
  return { settings: s, feeds: feedRows, links: linkRows, posts: postRows };
});

export async function getAdminData() {
  const db = await getDb();
  const [s, feedRows, linkRows, postRows, clickCounts] = await Promise.all([
    getSettings(),
    db.select().from(feeds).orderBy(asc(feeds.position)),
    db.select().from(linksTable).orderBy(asc(linksTable.position)),
    db.select().from(posts).orderBy(asc(posts.position), desc(posts.publishedAt)),
    db.select({ linkId: clicks.linkId, n: count() }).from(clicks).groupBy(clicks.linkId),
  ]);
  const clicksByLink = new Map(clickCounts.map((c) => [c.linkId, Number(c.n)]));
  return { settings: s, feeds: feedRows, links: linkRows, posts: postRows, clicksByLink };
}

export async function resolveSlug(slug: string) {
  const db = await getDb();
  return db.query.linksTable.findFirst({
    where: and(eq(linksTable.slug, slug), eq(linksTable.enabled, true)),
    columns: { id: true, url: true },
  });
}

export async function recordClick(linkId: string) {
  const db = await getDb();
  await db.insert(clicks).values({ linkId });
}

export type Range = "7d" | "30d" | "90d";

export async function getStats(range: Range, day?: string | null) {
  const db = await getDb();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);
  const tz = "Europe/Lisbon";
  // The chart series always spans the full range so any day can be picked.
  const perDay = await db
    .select({ day: sql<string>`to_char(${clicks.ts} at time zone ${tz}, 'YYYY-MM-DD')`, n: count() })
    .from(clicks)
    .where(gte(clicks.ts, since))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  // Total + per-link honor the selected day when one is picked, else the range.
  const scope = day
    ? sql`to_char(${clicks.ts} at time zone ${tz}, 'YYYY-MM-DD') = ${day}`
    : gte(clicks.ts, since);
  const [totalRow] = await db.select({ n: count() }).from(clicks).where(scope);
  const [prevRow] = day
    ? [undefined]
    : await db.select({ n: count() }).from(clicks).where(and(gte(clicks.ts, prevSince), lt(clicks.ts, since)));
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
