import type { CSSProperties } from "react";
import type { Settings } from "@/lib/db/schema";
import { fontStack, googleFamilies, googleFontsHref } from "@/lib/font-options";

const hex = (v: string | null | undefined, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? (v as string) : fallback);

const SHAPE: Record<string, string> = { circle: "rounded-full", rounded: "rounded-2xl", squircle: "rounded-[32%]", burst: "cz-burst" };
export const shapeClass = (shape?: string | null) => SHAPE[shape ?? "circle"] ?? "rounded-full";

/**
 * Props to spread on the public page's root <main>: button style/roundness hooks
 * (consumed by the .cz-* rules in globals.css) and the chosen fonts as CSS vars.
 */
export function customMainProps(s: Settings) {
  return {
    "data-btn": s.buttonStyle,
    "data-btnr": s.buttonRadius,
    style: {
      ["--font-body" as string]: fontStack(s.fontBody),
      ["--font-heading" as string]: fontStack(s.fontHeading),
      fontFamily: "var(--font-body)",
    } as CSSProperties,
  };
}

/** Per-theme accent override + the Google Fonts stylesheet for the chosen families. */
export function Customize({ settings }: { settings: Settings }) {
  const al = hex(settings.accentLight, "#0e7c66");
  const ad = hex(settings.accentDark, "#3ccba8");
  const css =
    `:root{--accent:${al};--accent-soft:color-mix(in srgb, ${al} 14%, #ffffff)}` +
    `html[data-theme="dark"]{--accent:${ad};--accent-soft:color-mix(in srgb, ${ad} 22%, #1c1c20)}`;
  const href = googleFontsHref(googleFamilies(settings.fontBody, settings.fontHeading));
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {href ? <link rel="stylesheet" href={href} precedence="default" /> : null}
    </>
  );
}
