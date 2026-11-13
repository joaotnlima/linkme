/* eslint-disable @next/next/no-img-element */
function builtin(url?: string | null) {
  if (!url) return null;
  if (/^mailto:/i.test(url)) return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
  if (/^tel:/i.test(url)) return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2z" /></svg>;
  return null;
}

export function LinkIcon({ title, iconUrl, iconEmoji, url, size = 40, round = false }: { title: string; iconUrl: string | null; iconEmoji: string | null; url?: string | null; size?: number; round?: boolean }) {
  const radius = round ? "9999px" : `${Math.round(size / 4)}px`;
  const base = { width: size, height: size, borderRadius: radius } as const;
  if (iconEmoji) {
    return (
      <div aria-hidden="true" style={base} className="bg-tile flex items-center justify-center shrink-0" >
        <span style={{ fontSize: Math.round(size * 0.55), lineHeight: 1 }}>{iconEmoji}</span>
      </div>
    );
  }
  const glyph = builtin(url);
  if (glyph) {
    return (
      <div aria-hidden="true" style={base} className="bg-tile text-ink shrink-0 flex items-center justify-center">
        <span style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5), display: "block" }}>{glyph}</span>
      </div>
    );
  }
  if (iconUrl) {
    return (
      <div aria-hidden="true" style={base} className="bg-tile overflow-hidden shrink-0 flex items-center justify-center">
        <img src={iconUrl} alt="" width={size} height={size} style={{ width: Math.round(size * 0.7), height: Math.round(size * 0.7), objectFit: "contain" }} />
      </div>
    );
  }
  const letter = (title.trim()[0] || "•").toUpperCase();
  return (
    <div aria-hidden="true" style={base} className="bg-tile text-ink flex items-center justify-center font-bold shrink-0">
      <span style={{ fontSize: Math.round(size * 0.38) }}>{letter}</span>
    </div>
  );
}
