// Any Google font by family name. "" / "default" = system stack, "mono" = mono.
// Plain data (no next/font) so client, validation and public pages can share it.

export function fontStack(name?: string | null): string {
  const n = (name || "").trim();
  if (!n || n.toLowerCase() === "default") return "var(--font-sans)";
  if (n.toLowerCase() === "mono") return "ui-monospace, SFMono-Regular, Menlo, monospace";
  return `'${n}', var(--font-sans)`;
}

/** Distinct real Google family names among the chosen fonts (ignores default/mono). */
export function googleFamilies(...names: (string | null | undefined)[]): string[] {
  return [...new Set(names.map((x) => (x || "").trim()).filter((n) => n && !["default", "mono"].includes(n.toLowerCase())))];
}

/** A Google Fonts CSS2 URL for the given families, or null if there are none. */
export function googleFontsHref(families: string[]): string | null {
  if (!families.length) return null;
  const q = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

/** Popular families shown as suggestions in the picker (any name still works). */
export const POPULAR_FONTS = [
  "Inter", "Roboto", "Open Sans", "Poppins", "Montserrat", "Lato", "Nunito", "Raleway",
  "Work Sans", "DM Sans", "Manrope", "Space Grotesk", "Plus Jakarta Sans", "Sora", "Outfit",
  "Figtree", "Rubik", "Mulish", "Karla", "Barlow", "Archivo", "Oswald", "Bebas Neue",
  "Playfair Display", "Lora", "Merriweather", "Libre Baskerville", "Cormorant", "PT Serif",
  "Source Serif 4", "Quicksand", "Comfortaa", "Josefin Sans", "Caveat", "Dancing Script",
  "Pacifico", "JetBrains Mono", "Roboto Mono", "Space Mono", "IBM Plex Mono",
];
