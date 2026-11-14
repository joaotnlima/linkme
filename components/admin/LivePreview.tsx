"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import type { Link, Settings } from "@/lib/db/schema";
import { fontStack, googleFamilies, googleFontsHref } from "@/lib/font-options";
import { renderBackground } from "@/components/public/backgrounds";
import { LinkIcon } from "@/components/public/Icon";

type Form = Record<string, string>;

const SHAPE: Record<string, string> = { circle: "rounded-full", rounded: "rounded-2xl", squircle: "rounded-[32%]", burst: "cz-burst" };

const LIGHT = { "--bg": "#f4f3ef", "--card": "#ffffff", "--line": "#e2e0d8", "--ink": "#16161a", "--muted": "#5f5e58", "--tile": "#e9e7e0", "--bg-stroke": "#8a8880", "--bg-opacity": "0.32" } as Record<string, string>;
const DARK = { "--bg": "#121214", "--card": "#1c1c20", "--line": "#2a2a30", "--ink": "#eceae4", "--muted": "#a3a19a", "--tile": "#2a2a30", "--bg-stroke": "#8c8a83", "--bg-opacity": "0.38" } as Record<string, string>;

// Live, desktop-only preview of the public page. Reads the Look form on every
// keystroke so owners see design changes before saving.
export function LivePreview({ settings, links }: { settings: Settings; links: Link[] }) {
  const [f, setF] = useState<Form>({});
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const form = document.getElementById("look-form") as HTMLFormElement | null;
    if (!form) return;
    const read = () => {
      const fd = new FormData(form);
      const o: Form = {};
      for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
      setF(o);
    };
    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => { form.removeEventListener("input", read); form.removeEventListener("change", read); };
  }, []);

  const name = f.displayName ?? settings.displayName;
  const tagline = f.tagline ?? settings.tagline ?? "";
  const bio = f.bio ?? settings.bio ?? "";
  const accent = (dark ? f.accentDark : f.accentLight) || (dark ? "#3ccba8" : "#0e7c66");
  const cards = links.filter((l) => l.display !== "icon").slice(0, 3);
  const socials = links.filter((l) => l.display === "icon").slice(0, 5);
  const shape = SHAPE[f.profileShape ?? settings.profileShape] ?? "rounded-full";
  const editorial = (f.layout ?? settings.layout) === "editorial";
  const bs = f.buttonStyle ?? settings.buttonStyle;
  const br = f.buttonRadius ?? settings.buttonRadius;
  const radiusPx = br === "pill" ? 9999 : br === "sharp" ? 8 : 16;
  const cardStyle = (featured: boolean) => {
    const s: Record<string, string | number> = { borderRadius: radiusPx };
    if (!featured) {
      if (bs === "glass") { s.background = "color-mix(in srgb, var(--card) 50%, transparent)"; s.backdropFilter = "blur(10px)"; s.WebkitBackdropFilter = "blur(10px)"; }
      else if (bs === "outline") { s.background = "transparent"; }
    }
    return s;
  };

  const layout = f.layout ?? settings.layout;
  const bannerUrl = f.bannerUrl ?? settings.bannerUrl;
  const headingStyle = { fontFamily: "var(--font-heading)" } as const;
  const photoBig = settings.avatarUrl
    ? <img src={settings.avatarUrl} alt="" className="w-full aspect-[4/5] object-cover rounded-2xl bg-tile" />
    : <div className="w-full aspect-[4/5] rounded-2xl bg-tile flex items-center justify-center"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Your photo</span></div>;
  const photoBleed = settings.avatarUrl
    ? <img src={settings.avatarUrl} alt="" className="block w-full aspect-[3/4] object-cover bg-tile" />
    : <div className="w-full aspect-[3/4] bg-tile flex items-center justify-center"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Your photo</span></div>;
  const fadeEl = <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />;
  const avatarSm = (extra = "") => settings.avatarUrl
    ? <img src={settings.avatarUrl} alt="" className={`w-20 h-20 object-cover ${shape} ${extra}`} />
    : <div className={`w-20 h-20 bg-accent text-white flex items-center justify-center text-2xl font-bold ${shape} ${extra}`}>{name.trim()[0]?.toUpperCase() ?? "•"}</div>;
  const texts = <>{bio ? <p className="text-xs text-muted leading-snug max-w-[240px]">{bio}</p> : null}{tagline ? <p className="text-[13px] font-medium max-w-[240px]">{tagline}</p> : null}</>;
  const fontHref = googleFontsHref(googleFamilies(f.fontBody ?? settings.fontBody, f.fontHeading ?? settings.fontHeading));

  return (
    <div className="flex flex-col items-center gap-3">
      {fontHref ? <link rel="stylesheet" href={fontHref} precedence="default" /> : null}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-muted uppercase tracking-wider">Live preview</span>
        <button type="button" onClick={() => setDark((d) => !d)} className="h-7 px-2.5 rounded-full border border-line text-[12px] font-semibold cursor-pointer">{dark ? "Dark" : "Light"}</button>
      </div>
      <div className="w-[300px] h-[600px] rounded-[2.2rem] border-[6px] border-ink/80 bg-black overflow-hidden shadow-xl">
        <div
          className="relative w-full h-full overflow-y-auto"
          data-btn={f.buttonStyle ?? settings.buttonStyle}
          data-btnr={f.buttonRadius ?? settings.buttonRadius}
          style={{
            ...(dark ? DARK : LIGHT),
            ["--accent" as string]: accent,
            ["--accent-soft" as string]: `color-mix(in srgb, ${accent} ${dark ? 22 : 14}%, ${dark ? "#1c1c20" : "#ffffff"})`,
            ["--font-body" as string]: fontStack(f.fontBody ?? settings.fontBody),
            ["--font-heading" as string]: fontStack(f.fontHeading ?? settings.fontHeading),
            fontFamily: "var(--font-body)",
            background: "var(--bg)",
            color: "var(--ink)",
          }}
        >
          <div className="absolute inset-0">{renderBackground(f.background ?? settings.background)}</div>
          <div className={`relative z-10 flex flex-col gap-3 px-4 pt-6 pb-8 ${editorial ? "text-left" : "items-center text-center"}`}>
            {layout === "banner" ? (
              <>
                <div className="relative -mx-4 -mt-6 w-[calc(100%+2rem)] h-20 bg-accent" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                {avatarSm("-mt-8 border-4 relative z-10")}
                <h1 className="text-lg font-bold leading-tight" style={headingStyle}>{name}</h1>
                {texts}
              </>
            ) : layout === "callout" ? (
              <>
                <h1 className="relative z-10 text-[34px] font-extrabold tracking-tight leading-[0.9] px-1" style={headingStyle}>{name}</h1>
                <div className="relative -mx-4 -mt-6">
                  {photoBleed}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4" style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }} />
                  {fadeEl}
                </div>
                {texts}
              </>
            ) : layout === "hero" ? (
              <>
                <div className="relative -mx-4 -mt-6">
                  {photoBleed}
                  {fadeEl}
                  <h1 className="absolute inset-x-0 bottom-2 px-3 text-center text-2xl font-extrabold leading-none" style={headingStyle}>{name}</h1>
                </div>
                {texts}
              </>
            ) : editorial ? (
              <>
                {photoBig}
                <h1 className="text-xl font-bold leading-tight" style={headingStyle}>{tagline || name}</h1>
                {bio ? <p className="text-xs text-muted leading-snug max-w-[240px]">{bio}</p> : null}
              </>
            ) : (
              <>
                {avatarSm()}
                <h1 className="text-lg font-bold leading-tight" style={headingStyle}>{name}</h1>
                {texts}
              </>
            )}
            {socials.length ? (
              <div className="flex gap-2 pt-0.5">
                {socials.map((s) => (
                  <span key={s.id} className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center overflow-hidden"><LinkIcon title={s.title} iconUrl={s.iconUrl} iconEmoji={s.iconEmoji} url={s.url} size={32} round /></span>
                ))}
              </div>
            ) : null}
            <div className="w-full flex flex-col gap-2.5 pt-2">
              {cards.map((l, i) => (
                <div key={l.id} style={cardStyle(i === 0)} className={`flex items-center gap-2.5 border px-2.5 py-2 ${i === 0 ? "bg-accent-soft border-accent" : "bg-card border-line"}`}>
                  <LinkIcon title={l.title} iconUrl={l.iconUrl} iconEmoji={l.iconEmoji} url={l.url} size={30} />
                  <span className="text-[13px] font-semibold truncate">{l.title}</span>
                </div>
              ))}
              {cards.length === 0 ? <div style={cardStyle(false)} className="border border-line bg-card px-3 py-3 text-xs text-muted">Your links appear here</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
