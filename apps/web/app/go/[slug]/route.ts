import { NextResponse, type NextRequest } from "next/server";
import { resolveSlug, recordClick } from "@linkme/core/lib/queries";
import { withUtms } from "@linkme/core/lib/slug";

export const dynamic = "force-dynamic";

const BOT_RE = /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|whatsapp|telegram|curl|wget/i;

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const link = await resolveSlug(slug);
  if (!link) return new NextResponse("Not found", { status: 404 });
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_RE.test(ua)) {
    // Inline insert: one indexed row, kept out of the redirect's failure path.
    try {
      await recordClick(link.id);
    } catch (e) {
      console.error("click insert failed", slug, e);
    }
  }
  const source = request.nextUrl.hostname.replace(/^www\./, "");
  return NextResponse.redirect(withUtms(link.url, source, slug), { status: 302 });
}
