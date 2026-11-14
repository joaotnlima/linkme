/* eslint-disable @next/next/no-img-element */
import type { Settings } from "@/lib/db/schema";
import { shapeClass } from "./Customize";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

/**
 * Header composition for the centered page, chosen in Look → Design → Header layout:
 * classic (round avatar), hero (big photo, name below), callout (name on top, big
 * photo), banner (color/image banner + overlapping avatar). "editorial" is its own
 * page component and never reaches here.
 */
export function ProfileHeader({ settings }: { settings: Settings }) {
  const v = settings.layout;
  const name = settings.displayName;

  const Texts = () => (
    <>
      {settings.bio ? <p className="text-[15px] md:text-base leading-relaxed text-muted max-w-[420px]">{settings.bio}</p> : null}
      {settings.tagline ? <p className="mt-1 text-sm md:text-base font-medium max-w-[460px]">{settings.tagline}</p> : null}
      {settings.quote ? <p className="text-xs md:text-[13px] italic text-muted max-w-[460px]">{settings.quote}</p> : null}
    </>
  );
  const Name = ({ cls }: { cls: string }) => <h1 className={`cz-heading font-bold leading-tight tracking-tight ${cls}`}>{name}</h1>;
  const Photo = ({ cls }: { cls: string }) =>
    settings.avatarUrl ? (
      <img src={settings.avatarUrl} alt="" className={`object-cover bg-tile ${cls}`} />
    ) : (
      <div className={`bg-tile flex items-center justify-center ${cls}`}><span className="text-xs font-semibold uppercase tracking-wider text-muted">Add your photo</span></div>
    );
  const Avatar = ({ cls }: { cls: string }) =>
    settings.avatarUrl ? (
      <img src={settings.avatarUrl} alt="" className={`object-cover ${shapeClass(settings.profileShape)} ${cls}`} />
    ) : (
      <div aria-hidden="true" className={`bg-accent text-white flex items-center justify-center font-bold ${shapeClass(settings.profileShape)} ${cls}`}>{initials(name)}</div>
    );

  if (v === "hero") {
    return (
      <header className="flex flex-col items-center gap-3 text-center">
        <Photo cls="w-full aspect-[4/5] rounded-3xl" />
        <Name cls="text-[26px] md:text-[32px]" />
        <Texts />
      </header>
    );
  }
  if (v === "callout") {
    return (
      <header className="flex flex-col items-center gap-3 text-center">
        <Name cls="text-[34px] md:text-[44px]" />
        <Photo cls="w-full aspect-[4/5] rounded-3xl" />
        <Texts />
      </header>
    );
  }
  if (v === "banner") {
    return (
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div
          className="w-full h-28 md:h-32 rounded-2xl overflow-hidden bg-accent"
          style={settings.bannerUrl ? { backgroundImage: `url(${settings.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <Avatar cls="w-24 h-24 -mt-12 border-4 border-bg text-3xl" />
        <Name cls="text-[22px] md:text-[26px]" />
        <Texts />
      </header>
    );
  }
  return (
    <header className="flex flex-col items-center gap-2.5 text-center">
      <Avatar cls="w-24 h-24 md:w-28 md:h-28 text-4xl" />
      <Name cls="text-[22px] md:text-[26px]" />
      <Texts />
    </header>
  );
}
