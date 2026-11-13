import "server-only";
import QRCode from "qrcode";
import { env } from "@/lib/env";

export const siteUrl = env.siteUrl.replace(/\/$/, "");

/** QR of the public page as an SVG string (always dark-on-white: cameras read inverted codes poorly). */
export async function siteQrSvg(): Promise<string> {
  const svg = await QRCode.toString(siteUrl, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#16161a", light: "#ffffff00" } });
  return svg.replace("<svg ", '<svg aria-hidden="true" ');
}
