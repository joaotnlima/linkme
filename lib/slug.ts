export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "link";
}

export function platformOf(url: string): "linkedin" | "instagram" | "other" {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.endsWith("linkedin.com")) return "linkedin";
    if (h.endsWith("instagram.com")) return "instagram";
  } catch {}
  return "other";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
