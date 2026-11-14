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

/**
 * Append UTM params so a destination carries attribution back to this page.
 * Leaves existing utm_* params and non-http(s) links (mailto:, tel:) untouched.
 */
export function withUtms(rawUrl: string, source: string, campaign?: string): string {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return rawUrl;
    if (source && !u.searchParams.has("utm_source")) u.searchParams.set("utm_source", source);
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "linkinbio");
    if (campaign && !u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return rawUrl;
  }
}
