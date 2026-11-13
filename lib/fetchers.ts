import "server-only";
import { putPublicFile } from "@/lib/storage";

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// A plain browser UA: LinkedIn and others answer 999/login walls to unknown bot UAs but
// serve the public post page (with its OpenGraph tags) to browsers.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

async function fetchWithLimit(url: string, accept: string, maxBytes = MAX_HTML_BYTES) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA, accept, "accept-language": "en-US,en;q=0.9,pt;q=0.8" }, redirect: "follow" });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) return null;
    return { buf, type: res.headers.get("content-type") || "" , finalUrl: res.url };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Decodes the HTML entities found in attribute values (og:image URLs carry &amp; etc.). */
function decodeEntities(v: string): string {
  return v
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? m[4]) : null;
}

/** Parses the <head> for icon links and OpenGraph tags. Regex on purpose: no HTML parser dependency. */
export function parseHead(html: string, baseUrl: string) {
  const head = html.slice(0, 200_000);
  const icons: { href: string; sizes: number }[] = [];
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") || "").toLowerCase();
    const href = attr(tag, "href");
    if (!href || !/\bicon\b/.test(rel) || /mask-icon/.test(rel)) continue;
    const sizes = parseInt((attr(tag, "sizes") || "0").split("x")[0], 10) || (rel.includes("apple") ? 180 : 32);
    try {
      icons.push({ href: new URL(href, baseUrl).toString(), sizes });
    } catch {}
  }
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") || attr(tag, "name") || "").toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !(key in meta)) meta[key] = content;
  }
  const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  return { icons: icons.sort((a, b) => b.sizes - a.sizes), meta, title };
}

/**
 * Resolves and stores a site icon for a link. Order: <link rel=icon> (largest) → /favicon.ico → null.
 * Returns a public URL or null (the UI then shows a letter tile).
 */
export async function fetchIconFor(linkId: string, url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null; // mailto:/tel: use a built-in glyph
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return null;
  }
  const candidates: string[] = [];
  const page = await fetchWithLimit(url, "text/html");
  if (page && page.type.includes("html")) {
    const { icons } = parseHead(new TextDecoder().decode(page.buf), page.finalUrl || url);
    candidates.push(...icons.map((i) => i.href));
  }
  candidates.push(`${origin}/favicon.ico`);
  for (const c of candidates) {
    const img = await fetchWithLimit(c, "image/*", MAX_IMAGE_BYTES);
    if (!img || !img.type.startsWith("image/") || img.buf.byteLength < 64) continue;
    const ext = img.type.includes("svg") ? "svg" : img.type.includes("png") ? "png" : img.type.includes("jpeg") ? "jpg" : img.type.includes("webp") ? "webp" : "ico";
    return putPublicFile(`icons/${linkId}.${ext}`, img.buf, img.type);
  }
  return null;
}

export type OgResult = { title?: string; excerpt?: string; imageUrl?: string; publishedAt?: Date; blocked: boolean };

/** OpenGraph for a post URL. `blocked: true` when the site refused us (LinkedIn does this often). */
export async function fetchOg(postId: string, url: string): Promise<OgResult> {
  const page = await fetchWithLimit(url, "text/html");
  if (!page || !page.type.includes("html")) return { blocked: true };
  const { meta, title } = parseHead(new TextDecoder().decode(page.buf), page.finalUrl || url);
  const ogTitle = meta["og:title"] || meta["twitter:title"] || title;
  const excerpt = meta["og:description"] || meta["description"] || meta["twitter:description"];
  const image = meta["og:image"] || meta["twitter:image"];
  const published = meta["article:published_time"] || meta["og:updated_time"];
  const blocked = (!ogTitle && !excerpt) || /^(sign in|login|join linkedin)/i.test(ogTitle || "");
  const out: OgResult = { blocked };
  if (blocked) return out;
  if (ogTitle) out.title = ogTitle.slice(0, 200);
  if (excerpt) out.excerpt = excerpt.slice(0, 400);
  if (published && !Number.isNaN(Date.parse(published))) out.publishedAt = new Date(published);
  if (image) {
    const img = await fetchWithLimit(image, "image/*", MAX_IMAGE_BYTES);
    if (img && img.type.startsWith("image/")) {
      const ext = img.type.includes("png") ? "png" : img.type.includes("webp") ? "webp" : "jpg";
      out.imageUrl = await putPublicFile(`posts/${postId}.${ext}`, img.buf, img.type);
    } else {
      out.imageUrl = image; // hotlink as a fallback
    }
  }
  return out;
}

/** Downloads an external image into our storage; returns null when it cannot (then the caller keeps the hotlink). */
export async function storeImageFromUrl(key: string, url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const img = await fetchWithLimit(url, "image/*", MAX_IMAGE_BYTES);
  if (!img || !img.type.startsWith("image/")) return null;
  const ext = img.type.includes("png") ? "png" : img.type.includes("webp") ? "webp" : img.type.includes("gif") ? "gif" : "jpg";
  return putPublicFile(`${key}.${ext}`, img.buf, img.type);
}

/** Instagram Graph API (Creator/Business account). Verify field names against current Meta docs. */
export async function fetchInstagramMedia(token: string) {
  const u = new URL("https://graph.instagram.com/me/media");
  u.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
  u.searchParams.set("limit", "12");
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error(`Instagram API ${res.status}`);
  const json = (await res.json()) as { data?: Array<{ id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string }> };
  return json.data ?? [];
}
