import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { fetchOg } from "@/lib/fetchers";
import { platformOf } from "@/lib/slug";

const { feeds, posts } = schema;

export type IngestResult =
  | { ok: true; postId: string; feedTitle: string; preview: "fetched" | "blocked" | "skipped"; duplicate: boolean }
  | { ok: false; error: string };

/**
 * Adds a post URL to a feed and enriches it with OpenGraph data.
 * Used by the admin form (addPostByUrl) and by POST /api/ingest (share sheet / bookmarklet).
 * Feed resolution: explicit feedId → feed whose title mentions the platform → first enabled manual feed.
 */
export async function ingestPost(input: { url: string; feedId?: string | null; title?: string | null }): Promise<IngestResult> {
  const db = await getDb();
  const platform = platformOf(input.url);

  let feed = input.feedId ? await db.query.feeds.findFirst({ where: eq(feeds.id, input.feedId) }) : undefined;
  if (!feed) {
    const manual = await db.select().from(feeds).where(eq(feeds.source, "manual")).orderBy(asc(feeds.position));
    feed = manual.find((f) => f.enabled && f.title.toLowerCase().includes(platform)) ?? manual.find((f) => f.enabled) ?? manual[0];
  }
  if (!feed) return { ok: false, error: "No manual feed exists. Create one in /admin/look first." };

  const existing = await db.query.posts.findFirst({ where: and(eq(posts.feedId, feed.id), eq(posts.url, input.url)), columns: { id: true } });
  if (existing) return { ok: true, postId: existing.id, feedTitle: feed.title, preview: "skipped", duplicate: true };

  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${posts.position}), -1)` }).from(posts).where(eq(posts.feedId, feed.id));
  // New posts go to the top of the feed: shift everything down by one.
  await db.update(posts).set({ position: sql`${posts.position} + 1` }).where(eq(posts.feedId, feed.id));
  void max;
  const [row] = await db
    .insert(posts)
    .values({ feedId: feed.id, url: input.url, platform, title: input.title || null, source: "manual", position: 0 })
    .returning({ id: posts.id });

  const og = await fetchOg(row.id, input.url).catch(() => ({ blocked: true }) as const);
  if (og.blocked) return { ok: true, postId: row.id, feedTitle: feed.title, preview: "blocked", duplicate: false };
  await db
    .update(posts)
    .set({ title: input.title || og.title || null, excerpt: og.excerpt ?? null, imageUrl: og.imageUrl ?? null, publishedAt: og.publishedAt ?? null, source: "og" })
    .where(eq(posts.id, row.id));
  return { ok: true, postId: row.id, feedTitle: feed.title, preview: "fetched", duplicate: false };
}

export async function latestPosts(limit = 5) {
  const db = await getDb();
  return db.select({ id: posts.id, url: posts.url, title: posts.title }).from(posts).orderBy(desc(posts.createdAt)).limit(limit);
}
