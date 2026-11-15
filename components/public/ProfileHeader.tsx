/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import type { Settings } from "@/lib/db/schema";
import { shapeClass } from "./Customize";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

/**
 * Header composition chosen in Look → Design → Header layout.
 * - classic: round avatar, centered (padded container; `share` rendered by the page).
 * - hero: full-bleed photo, name overlaid at the bottom, fading into the page.
 * - callout: big name on top, full-bleed photo below, fading into the page.
 * - banner: full-bleed cover image + overlapping avatar, name/bio below.
 * For hero/callout/banner the page passes `share` (share + theme toggle) to overlay.
 */
export function ProfileHeader({ settings, share, layout }: { settings: Settings; share?: ReactNode; layout?: string }) {
  const v = layout ?? settings.layout;
  const name = settings.displayName;

  const Texts = () => (
    <>
      {settings.bio ? <p className="text-[15px] md:text-base leading-relaxed text-muted max-w-[420px]">{settings.bio}</p> : null}
      {settings.tagline ? <p className="mt-1 text-sm md:text-base font-medium max-w-[460px]">{settings.tagline}</p> : null}
      {settings.quote ? <p className="text-xs md:text-[13px] italic text-muted max-w-[460px]">{settings.quote}</p> : null}
    </>
  );
  const photo = (cls: string) =>
    settings.avatarUrl ? (
      <img src={settings.avatarUrl} alt="" className={`object-cover bg-tile ${cls}`} />
    ) : (
      <div className={`bg-tile flex items-center justify-center ${cls}`}><span className="text-xs font-semibold uppercase tracking-wider text-muted">Add your photo</span></div>
    );
  const avatar = (cls: string) =>
    settings.avatarUrl ? (
      <img src={settings.avatarUrl} alt="" className={`object-cover ${shapeClass(settings.profileShape)} ${cls}`} />
    ) : (
      <div aria-hidden="true" className={`bg-accent text-white flex items-center justify-center font-bold ${shapeClass(settings.profileShape)} ${cls}`}>{initials(name)}</div>
    );
  // Full-bleed media for hero/callout: the looping banner video if one is set, else the photo.
  const media = (cls: string) =>
    settings.bannerVideoUrl ? (
      <video src={settings.bannerVideoUrl} autoPlay muted loop playsInline poster={settings.avatarUrl ?? undefined} className={`block object-cover bg-tile ${cls}`} />
    ) : (
      photo(cls)
    );
  const fade = <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />;

  if (v === "hero") {
    return (
      <header className="flex flex-col">
        <div className="relative">
          {media("block w-full aspect-[3/4]")}
          {fade}
          {share}
          <h1 className="cz-heading absolute inset-x-0 bottom-3 px-4 text-center text-[36px] md:text-[48px] font-extrabold tracking-tight leading-none">{name}</h1>
        </div>
        <div className="px-4 pt-1.5 flex flex-col items-center gap-1 text-center"><Texts /></div>
      </header>
    );
  }

  if (v === "callout") {
    return (
      <header className="flex flex-col">
        <div className="relative z-10 px-4 pt-14">
          {share}
          <h1 className="cz-heading text-center text-[44px] md:text-[60px] font-extrabold tracking-tight leading-[0.9]">{name}</h1>
        </div>
        <div className="relative -mt-7 md:-mt-10">
          {photo("block w-full aspect-[3/4]")}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4" style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }} />
          {fade}
        </div>
        <div className="px-4 pt-1.5 flex flex-col items-center gap-1 text-center"><Texts /></div>
      </header>
    );
  }

  if (v === "banner") {
    return (
      <header className="flex flex-col items-center">
        <div className="relative w-full">
          {settings.bannerVideoUrl ? (
            <video src={settings.bannerVideoUrl} autoPlay muted loop playsInline poster={settings.bannerUrl ?? undefined} className="w-full h-36 md:h-44 object-cover bg-accent" />
          ) : (
            <div className="w-full h-36 md:h-44 bg-accent" style={settings.bannerUrl ? { backgroundImage: `url(${settings.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
          )}
          {share}
        </div>
        {avatar("w-24 h-24 -mt-12 border-4 border-bg text-3xl relative z-10")}
        <div className="px-4 pt-2.5 flex flex-col items-center gap-2 text-center">
          <h1 className="cz-heading text-[22px] md:text-[26px] font-bold leading-tight tracking-tight">{name}</h1>
          <Texts />
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-col items-center gap-2.5 text-center">
      {avatar("w-24 h-24 md:w-28 md:h-28 text-4xl")}
      <h1 className="cz-heading text-[22px] md:text-[26px] font-bold leading-tight tracking-tight">{name}</h1>
      <Texts />
    </header>
  );
}
