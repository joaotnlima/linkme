// Plain data (no next/font) so client components, validation and the public
// pages can share the font list without importing the server-only loaders.
export const FONTS: { key: string; label: string; css: string }[] = [
  { key: "default", label: "Default", css: "var(--font-sans)" },
  { key: "inter", label: "Inter", css: "var(--font-inter)" },
  { key: "poppins", label: "Poppins", css: "var(--font-poppins)" },
  { key: "grotesk", label: "Space Grotesk", css: "var(--font-grotesk)" },
  { key: "playfair", label: "Playfair (serif)", css: "var(--font-playfair)" },
  { key: "mono", label: "Mono", css: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

export const FONT_KEYS = FONTS.map((f) => f.key) as [string, ...string[]];

export function fontCss(key?: string | null) {
  return FONTS.find((f) => f.key === key)?.css ?? FONTS[0].css;
}
