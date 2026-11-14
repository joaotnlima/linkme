import { renderBackground } from "./backgrounds";

// Decorative homepage background, selected in the backoffice (Look → Background).
// Pure CSS/SVG animation, theme-aware, respects reduced motion. See ./backgrounds.tsx.
export function Background({ variant }: { variant?: string | null }) {
  return renderBackground(variant);
}
