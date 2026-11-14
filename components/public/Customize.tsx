import type { CSSProperties } from "react";
import type { Settings } from "@/lib/db/schema";
import { fontCss } from "@/lib/font-options";

const hex = (v: string | null | undefined, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? (v as string) : fallback);

/**
 * Props to spread on the public page's root <main>: button style/roundness hooks
 * (consumed by the .cz-* rules in globals.css) and the chosen fonts as CSS vars.
 */
export function customMainProps(s: Settings) {
  return {
    "data-btn": s.buttonStyle,
    "data-btnr": s.buttonRadius,
    style: {
      ["--font-body" as string]: fontCss(s.fontBody),
      ["--font-heading" as string]: fontCss(s.fontHeading),
      fontFamily: "var(--font-body)",
    } as CSSProperties,
  };
}

/** Per-theme accent override injected from the owner's chosen brand colors. */
export function Customize({ settings }: { settings: Settings }) {
  const al = hex(settings.accentLight, "#0e7c66");
  const ad = hex(settings.accentDark, "#3ccba8");
  const css =
    `:root{--accent:${al};--accent-soft:color-mix(in srgb, ${al} 14%, #ffffff)}` +
    `html[data-theme="dark"]{--accent:${ad};--accent-soft:color-mix(in srgb, ${ad} 22%, #1c1c20)}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
