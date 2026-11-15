// Turns a YouTube / Spotify URL into an embeddable iframe source.
// Returns null for anything that is not a recognised, embeddable media link.
export type Embed = { provider: "youtube" | "spotify"; src: string; title: string; height?: number };

export function embedFor(url: string): Embed | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const h = u.hostname.replace(/^www\./, "");

  // ---- YouTube (watch, youtu.be, shorts, embed) ----
  if (h === "youtu.be" || h.endsWith("youtube.com")) {
    let id = "";
    if (h === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? "";
    else id = u.searchParams.get("v") ?? "";
    id = id.replace(/[^a-zA-Z0-9_-]/g, "");
    if (id) return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, title: "YouTube video player" };
  }

  // ---- Spotify (track, album, playlist, episode, show, artist) ----
  if (h.endsWith("spotify.com")) {
    const parts = u.pathname.split("/").filter(Boolean);
    // Handle locale-prefixed paths like /intl-pt/track/...
    const ti = parts.findIndex((p) => ["track", "album", "playlist", "episode", "show", "artist"].includes(p));
    if (ti >= 0) {
      const type = parts[ti];
      const id = (parts[ti + 1] ?? "").replace(/[^a-zA-Z0-9]/g, "");
      if (id) {
        const tall = type === "playlist" || type === "album" || type === "show" || type === "artist";
        return { provider: "spotify", src: `https://open.spotify.com/embed/${type}/${id}`, title: "Spotify player", height: tall ? 380 : 152 };
      }
    }
  }

  return null;
}
