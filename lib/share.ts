import "server-only";
import { unstable_cache } from "next/cache";
import QRCode from "qrcode";
import { env } from "@/lib/env";

export const siteUrl = env.siteUrl.replace(/\/$/, "");

async function renderQrSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#16161a", light: "#ffffff00" } });
  return svg.replace("<svg ", '<svg aria-hidden="true" ');
}

/**
 * QR of a page as an SVG string (always dark-on-white: cameras read inverted
 * codes poorly). Cached by URL — a QR only depends on its URL, so it survives
 * content edits and is never regenerated at render time.
 */
export function qrSvgFor(url: string): Promise<string> {
  return unstable_cache(() => renderQrSvg(url), ["qr-svg", url])();
}

/** QR of the public page (single-tenant site URL). */
export function siteQrSvg(): Promise<string> {
  return qrSvgFor(siteUrl);
}
