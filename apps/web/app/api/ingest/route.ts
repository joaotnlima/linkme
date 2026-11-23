import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { httpUrl } from "@linkme/core/lib/validation";
import { ingestPost } from "@linkme/core/lib/ingest";
import { currentTenantId } from "@linkme/core/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest — add a post URL from outside the backoffice (iOS/Android share sheet, bookmarklet, n8n).
 * Auth: `Authorization: Bearer <INGEST_TOKEN>` or `?token=` (for share sheets that cannot set headers).
 * Body: JSON {url, title?, feedId?}, form-encoded, or plain text containing the URL.
 */
function tokenOk(request: NextRequest) {
  const expected = process.env.INGEST_TOKEN || "";
  if (!expected || expected.length < 16) return false;
  const header = request.headers.get("authorization") || "";
  const given = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : new URL(request.url).searchParams.get("token") || "";
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

function firstUrl(text: string) {
  return text.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? text.trim();
}

export async function POST(request: NextRequest) {
  if (!tokenOk(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const ct = request.headers.get("content-type") || "";
  let raw = "";
  let title: string | null = null;
  let feedId: string | null = null;
  try {
    if (ct.includes("application/json")) {
      const j = (await request.json()) as { url?: string; text?: string; title?: string; feedId?: string };
      raw = j.url || j.text || "";
      title = j.title || null;
      feedId = j.feedId || null;
    } else if (ct.includes("form")) {
      const fd = await request.formData();
      raw = String(fd.get("url") || fd.get("text") || "");
      title = String(fd.get("title") || "") || null;
      feedId = String(fd.get("feedId") || "") || null;
    } else {
      raw = await request.text();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "unreadable body" }, { status: 400 });
  }
  const parsed = httpUrl.safeParse(firstUrl(raw));
  if (!parsed.success || !/^https?:/i.test(parsed.data)) return NextResponse.json({ ok: false, error: "no valid http(s) URL in request" }, { status: 400 });
  const result = await ingestPost({ tenantId: await currentTenantId(), url: parsed.data, title, feedId });
  if (result.ok) revalidatePath("/");
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}

// Lets a share sheet / bookmarklet confirm the token without side effects.
export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: tokenOk(request) }, { status: tokenOk(request) ? 200 : 401 });
}
