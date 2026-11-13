/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { siteQrSvg, siteUrl } from "@/lib/share";
import { ShareActions } from "@/components/public/ShareActions";

export const revalidate = 60;

export const metadata: Metadata = { title: "Share", robots: { index: false } };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

/** Full-screen "business card": QR of the page, for showing your phone to someone. */
export default async function CardPage() {
  const s = await getSettings();
  const url = siteUrl;
  const svg = await siteQrSvg();
  const host = url.replace(/^https?:\/\//, "");
  return (
    <main className="flex-1 flex items-center justify-center p-5 bg-bg" data-theme-default={s.themeDefault}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme-default',${JSON.stringify(s.themeDefault)})` }} />
      <div className="w-full max-w-[360px] rounded-[28px] bg-card border border-line p-6 flex flex-col items-center gap-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        {s.avatarUrl ? (
          <img src={s.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div aria-hidden="true" className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold">{initials(s.displayName)}</div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold leading-tight">{s.displayName}</h1>
          {s.bio ? <p className="text-sm text-muted">{s.bio}</p> : null}
        </div>
        <div className="w-full aspect-square max-w-[260px] rounded-2xl bg-white p-4" role="img" aria-label={`QR code for ${url}`}>
          <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <p className="text-sm font-semibold tracking-wide">{host}</p>
        <ShareActions url={url} title={s.displayName} />
        <a href="/" className="text-xs text-muted">← back to the page</a>
      </div>
    </main>
  );
}
