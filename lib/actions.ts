"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { feedInput, httpUrl, linkInput, postInput, settingsInput } from "@/lib/validation";
import { slugify, platformOf } from "@/lib/slug";
import { fetchIconFor, fetchOg, fetchInstagramMedia, storeImageFromUrl } from "@/lib/fetchers";
import { ingestPost } from "@/lib/ingest";
import { sniffImage } from "@/lib/images";
import { assertPublicUrl } from "@/lib/safe-fetch";
import { putPublicFile } from "@/lib/storage";
import { env } from "@/lib/env";

const { settings, feeds, linksTable, posts } = schema;

export type ActionResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

function publish() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

function fieldErrors(e: unknown): ActionResult {
  const z = e as { issues?: Array<{ path: PropertyKey[]; message: string }> };
  if (z?.issues) {
    const fields: Record<string, string> = {};
    for (const i of z.issues) fields[String(i.path[0] ?? "")] = i.message;
    return { ok: false, error: "Check the highlighted fields.", fields };
  }
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

function str(fd: FormData, k: string) {
  return (fd.get(k) ?? "").toString();
}

/** Toggle inputs post a hidden "off" followed by "on" when checked; the last value wins. */
function checked(fd: FormData, k: string) {
  const all = fd.getAll(k).map(String);
  return all.length ? all[all.length - 1] === "on" : true;
}

async function uniqueSlug(base: string, exceptId?: string) {
  const db = await getDb();
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const hit = await db.query.linksTable.findFirst({ where: eq(linksTable.slug, candidate), columns: { id: true } });
    if (!hit || hit.id === exceptId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

// ---------- links ----------

export async function createLink(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const input = linkInput.parse({
      url: str(fd, "url"),
      title: str(fd, "title"),
      subtitle: str(fd, "subtitle"),
      section: str(fd, "section"),
      display: str(fd, "display") || "card",
      enabled: checked(fd, "enabled"),
      slug: str(fd, "slug"),
      iconEmoji: str(fd, "iconEmoji"),
    });
    if (/^https?:/i.test(input.url)) await assertPublicUrl(input.url);
    const db = await getDb();
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` }).from(linksTable);
    const slug = await uniqueSlug(input.slug || slugify(input.title));
    const [row] = await db
      .insert(linksTable)
      .values({
        url: input.url,
        title: input.title,
        subtitle: input.subtitle || null,
        section: input.section || null,
        display: input.display,
        enabled: input.enabled,
        slug,
        iconEmoji: input.iconEmoji || null,
        position: Number(max) + 1,
      })
      .returning({ id: linksTable.id });
    publish();
    // Icon fetch after the row exists; a failure leaves the letter tile.
    const iconUrl = await fetchIconFor(row.id, input.url).catch(() => null);
    if (iconUrl) {
      await db.update(linksTable).set({ iconUrl }).where(eq(linksTable.id, row.id));
      publish();
    }
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function updateLink(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const id = str(fd, "id");
    const input = linkInput.parse({
      url: str(fd, "url"),
      title: str(fd, "title"),
      subtitle: str(fd, "subtitle"),
      section: str(fd, "section"),
      display: str(fd, "display") || "card",
      enabled: checked(fd, "enabled"),
      slug: str(fd, "slug"),
      iconEmoji: str(fd, "iconEmoji"),
    });
    if (/^https?:/i.test(input.url)) await assertPublicUrl(input.url);
    const db = await getDb();
    const existing = await db.query.linksTable.findFirst({ where: eq(linksTable.id, id) });
    if (!existing) return { ok: false, error: "Link not found." };
    const slug = await uniqueSlug(input.slug || existing.slug, id);
    await db
      .update(linksTable)
      .set({
        url: input.url,
        title: input.title,
        subtitle: input.subtitle || null,
        section: input.section || null,
        display: input.display,
        enabled: input.enabled,
        slug,
        iconEmoji: input.iconEmoji || null,
        updatedAt: new Date(),
      })
      .where(eq(linksTable.id, id));
    publish();
    if (existing.url !== input.url || !existing.iconUrl) {
      const iconUrl = await fetchIconFor(id, input.url).catch(() => null);
      if (iconUrl) {
        await db.update(linksTable).set({ iconUrl }).where(eq(linksTable.id, id));
        publish();
      }
    }
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function setLinkEnabled(id: string, enabled: boolean): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    await db.update(linksTable).set({ enabled, updatedAt: new Date() }).where(eq(linksTable.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function deleteLink(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    await db.delete(linksTable).where(eq(linksTable.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

/** Move a link one step up or down. Positions are renumbered densely. */
export async function moveLink(id: string, dir: "up" | "down"): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    const me = await db.query.linksTable.findFirst({ where: eq(linksTable.id, id) });
    if (!me) return { ok: false, error: "Link not found." };
    const siblings = await db
      .select({ id: linksTable.id })
      .from(linksTable)
      .orderBy(asc(linksTable.position), asc(linksTable.createdAt));
    const ids = siblings.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await db.transaction(async (tx) => {
      for (let k = 0; k < ids.length; k++) {
        await tx.update(linksTable).set({ position: k }).where(eq(linksTable.id, ids[k]));
      }
    });
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

// ---------- settings / avatar ----------

export async function updateSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const input = settingsInput.parse({
      displayName: str(fd, "displayName"),
      bio: str(fd, "bio"),
      tagline: str(fd, "tagline"),
      quote: str(fd, "quote"),
      siteTitle: str(fd, "siteTitle"),
      siteDescription: str(fd, "siteDescription"),
      themeDefault: str(fd, "themeDefault") || "auto",
      footer: str(fd, "footer"),
      layout: str(fd, "layout") || "editorial",
      background: str(fd, "background") || "paths",
      accentLight: str(fd, "accentLight") || "#0e7c66",
      accentDark: str(fd, "accentDark") || "#3ccba8",
      buttonStyle: str(fd, "buttonStyle") || "solid",
      buttonRadius: str(fd, "buttonRadius") || "rounded",
      wallpaper: str(fd, "wallpaper") || "animated",
      wallpaperColor: str(fd, "wallpaperColor"),
      wallpaperColor2: str(fd, "wallpaperColor2"),
      wallpaperImageUrl: str(fd, "wallpaperImageUrl"),
      wallpaperVideoUrl: str(fd, "wallpaperVideoUrl"),
      profileShape: str(fd, "profileShape") || "circle",
      logoUrl: str(fd, "logoUrl"),
      fontBody: str(fd, "fontBody"),
      fontHeading: str(fd, "fontHeading"),
      ctaLabel: str(fd, "ctaLabel"),
      leadLinkId: str(fd, "leadLinkId"),
    });
    const db = await getDb();
    await db.update(settings).set({
      ...input,
      leadLinkId: input.leadLinkId || null,
      wallpaperColor: input.wallpaperColor || null,
      wallpaperColor2: input.wallpaperColor2 || null,
      wallpaperImageUrl: input.wallpaperImageUrl || null,
      wallpaperVideoUrl: input.wallpaperVideoUrl || null,
      logoUrl: input.logoUrl || null,
      updatedAt: new Date(),
    }).where(eq(settings.id, 1));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function setAvatar(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    if (fd.get("clear") === "1") {
      await db.update(settings).set({ avatarUrl: null }).where(eq(settings.id, 1));
      publish();
      return { ok: true };
    }
    const file = fd.get("avatar");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pick an image first." };
    if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Keep it under 2 MB." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind || kind.ext === "ico") return { ok: false, error: "Use a PNG, JPEG, GIF or WebP image." };
    const url = await putPublicFile(`avatar/avatar-${Date.now()}.${kind.ext}`, bytes, kind.type);
    await db.update(settings).set({ avatarUrl: url }).where(eq(settings.id, 1));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function setBanner(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    if (fd.get("clear") === "1") {
      await db.update(settings).set({ bannerUrl: null }).where(eq(settings.id, 1));
      publish();
      return { ok: true };
    }
    const file = fd.get("banner");
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Keep it under 5 MB." };
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = sniffImage(bytes);
      if (!kind || kind.ext === "ico") return { ok: false, error: "Use a PNG, JPEG, GIF or WebP image." };
      const url = await putPublicFile(`banner/banner-${Date.now()}.${kind.ext}`, bytes, kind.type);
      await db.update(settings).set({ bannerUrl: url }).where(eq(settings.id, 1));
      publish();
      return { ok: true };
    }
    const url = str(fd, "url");
    if (url) {
      await db.update(settings).set({ bannerUrl: url }).where(eq(settings.id, 1));
      publish();
      return { ok: true };
    }
    return { ok: false, error: "Paste a URL or choose an image." };
  } catch (e) {
    return fieldErrors(e);
  }
}

// ---------- feeds ----------

export async function upsertFeed(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const id = str(fd, "id");
    const input = feedInput.parse({
      title: str(fd, "title"),
      source: str(fd, "source") || "manual",
      style: str(fd, "style") || "cards",
      enabled: checked(fd, "enabled"),
    });
    const db = await getDb();
    if (id) {
      await db.update(feeds).set(input).where(eq(feeds.id, id));
    } else {
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${feeds.position}), -1)` }).from(feeds);
      await db.insert(feeds).values({ ...input, position: Number(max) + 1 });
    }
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function moveFeed(id: string, dir: "up" | "down"): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    const rows = await db.select({ id: feeds.id }).from(feeds).orderBy(asc(feeds.position));
    const ids = rows.map((r) => r.id);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await db.transaction(async (tx) => {
      for (let k = 0; k < ids.length; k++) await tx.update(feeds).set({ position: k }).where(eq(feeds.id, ids[k]));
    });
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function deleteFeed(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    await db.delete(feeds).where(eq(feeds.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

// ---------- posts ----------

export async function addPostByUrl(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const input = postInput.parse({ feedId: str(fd, "feedId"), url: str(fd, "url"), title: str(fd, "title") });
    const r = await ingestPost({ url: input.url, feedId: input.feedId, title: input.title || null });
    publish();
    if (!r.ok) return r;
    if (r.duplicate) return { ok: false, error: "That URL is already in this feed." };
    if (r.preview === "blocked" && !input.title) return { ok: false, error: "Saved, but the site blocked the preview fetch — edit the post to add a title." };
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function updatePost(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    await requireOwner();
    const id = str(fd, "id");
    const url = httpUrl.parse(str(fd, "url"));
    await assertPublicUrl(url);
    const db = await getDb();
    let imageUrl: string | null = str(fd, "imageUrl") || null;
    const previous = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { imageUrl: true } });
    // A pasted external image URL (CDN links expire and block hotlinking): copy it into our storage.
    if (imageUrl && imageUrl !== previous?.imageUrl && /^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith(env.siteUrl) && !imageUrl.startsWith("/")) {
      const stored = await storeImageFromUrl(`posts/${id}-${Date.now()}`, imageUrl).catch(() => null);
      if (stored) imageUrl = stored;
    }
    const file = fd.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 3 * 1024 * 1024) return { ok: false, error: "Keep the image under 3 MB." };
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = sniffImage(bytes);
      if (!kind || kind.ext === "ico") return { ok: false, error: "Use a PNG, JPEG, GIF or WebP image." };
      imageUrl = await putPublicFile(`posts/${id}-${Date.now()}.${kind.ext}`, bytes, kind.type);
    }
    await db
      .update(posts)
      .set({
        url,
        platform: platformOf(url),
        title: str(fd, "title").slice(0, 200) || null,
        excerpt: str(fd, "excerpt").slice(0, 400) || null,
        imageUrl,
        enabled: checked(fd, "enabled"),
      })
      .where(eq(posts.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

/** Re-runs the OpenGraph fetch for a post and overwrites title/excerpt/image/date. */
export async function refetchPost(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!post) return { ok: false, error: "Post not found." };
    const og = await fetchOg(post.id, post.url).catch(() => ({ blocked: true }) as const);
    if (og.blocked) return { ok: false, error: "The site blocked the preview fetch. Edit the title and image by hand." };
    await db
      .update(posts)
      .set({ title: og.title ?? post.title, excerpt: og.excerpt ?? post.excerpt, imageUrl: og.imageUrl ?? post.imageUrl, publishedAt: og.publishedAt ?? post.publishedAt, source: "og" })
      .where(eq(posts.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
    const db = await getDb();
    await db.delete(posts).where(eq(posts.id, id));
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}

/** Pulls the latest media for a feed with source = instagram_graph. */
export async function syncInstagram(feedId: string): Promise<ActionResult> {
  try {
    await requireOwner();
    if (!env.instagramToken) return { ok: false, error: "Set INSTAGRAM_ACCESS_TOKEN first (Creator/Business account)." };
    const media = await fetchInstagramMedia(env.instagramToken);
    const db = await getDb();
    let i = 0;
    for (const m of media) {
      const existing = await db.query.posts.findFirst({ where: and(eq(posts.feedId, feedId), eq(posts.externalId, m.id)), columns: { id: true } });
      const values = {
        feedId,
        url: m.permalink,
        platform: "instagram" as const,
        excerpt: (m.caption ?? "").slice(0, 400) || null,
        imageUrl: m.media_type === "VIDEO" ? (m.thumbnail_url ?? null) : (m.media_url ?? null),
        publishedAt: new Date(m.timestamp),
        source: "instagram_graph" as const,
        externalId: m.id,
        position: i++,
      };
      if (existing) await db.update(posts).set(values).where(eq(posts.id, existing.id));
      else await db.insert(posts).values(values);
    }
    publish();
    return { ok: true };
  } catch (e) {
    return fieldErrors(e);
  }
}
