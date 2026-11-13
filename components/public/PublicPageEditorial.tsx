/* eslint-disable @next/next/no-img-element */

import { Background } from "./Background";
import { ThemeToggle } from "./ThemeToggle";
import { LinkIcon } from "./Icon";
import { PublicBody, initials, type PageData } from "./PublicPage";
import { ShareCard } from "./ShareCard";
import { MadeBy } from "./MadeBy";
import { hostOf } from "@/lib/slug";


/**
 * "Editorial" layout — one face, one sentence, one action.
 * Hero above the fold: real photo, tagline as the headline, a single primary CTA
 * (settings.leadLinkId), social icons small. Links by section and feeds below.
 * Motion: a 300 ms staggered reveal on load; background paths at half strength;
 * nothing moves under prefers-reduced-motion.
 */
export function PublicPageEditorial({ settings, feeds, links, posts, qrSvg, siteUrl }: PageData) {
  const lead = settings.leadLinkId ? links.find((l) => l.id === settings.leadLinkId) ?? null : null;
  const socials = links.filter((l) => l.display === "icon");
  const headline = settings.tagline || settings.displayName;

  return (
    <main className="relative flex-1 overflow-hidden" data-theme-default={settings.themeDefault}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme-default',${JSON.stringify(settings.themeDefault)})` }} />
      <div className="absolute inset-0" style={{ opacity: 0.5 }}>
        <Background />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[960px] px-4 pt-4 pb-10 md:px-8 md:pt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-muted">{settings.displayName}</span>
          <div className="flex gap-2.5"><ShareCard url={siteUrl} qrSvg={qrSvg} name={settings.displayName} bio={settings.bio} avatarUrl={settings.avatarUrl} initials={initials(settings.displayName)} /><ThemeToggle /></div>
        </div>

        <section className="mt-6 md:mt-10 grid gap-6 md:gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
          <div className="reveal reveal-1 order-1 md:order-2">
            {settings.avatarUrl ? (
              <img src={settings.avatarUrl} alt={settings.displayName} className="w-full aspect-[4/5] md:aspect-[4/5] object-cover rounded-3xl bg-tile" />
            ) : (
              <div aria-hidden="true" className="w-full aspect-[4/5] rounded-3xl bg-tile flex items-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Add your photo in /admin/look</span>
              </div>
            )}
          </div>

          <div className="order-2 md:order-1 flex flex-col gap-4">
            {settings.bio ? <p className="reveal reveal-1 text-sm md:text-[15px] font-semibold uppercase tracking-[0.08em] text-muted">{settings.bio}</p> : null}
            <h1 className="reveal reveal-2 text-[28px] leading-[1.15] md:text-[40px] font-bold tracking-tight max-w-[20ch]">{headline}</h1>
            {settings.quote ? <p className="reveal reveal-3 text-sm md:text-base italic text-muted max-w-[46ch]">{settings.quote}</p> : null}

            <div className="reveal reveal-4 flex flex-col sm:flex-row gap-3 pt-2">
              {lead ? (
                <a href={`/go/${lead.slug}`} rel="noopener" className="card-hover h-14 px-6 rounded-2xl bg-accent text-white font-semibold text-base flex items-center justify-center gap-2.5">
                  <LinkIcon title={lead.title} iconUrl={lead.iconUrl} iconEmoji={lead.iconEmoji} url={lead.url} size={28} round />
                  {settings.ctaLabel || lead.title}
                </a>
              ) : null}
              {socials.length ? (
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  {socials.map((s) => (
                    <a key={s.id} href={`/go/${s.slug}`} aria-label={s.title} title={s.title} className="w-11 h-11 rounded-full bg-card border border-line flex items-center justify-center overflow-hidden">
                      <LinkIcon title={s.title} iconUrl={s.iconUrl} iconEmoji={s.iconEmoji} url={s.url} size={44} round />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="reveal reveal-5 mx-auto w-full max-w-[640px] mt-10 md:mt-16 flex flex-col gap-5">
          <PublicBody feeds={feeds} links={links} posts={posts} excludeLinkId={lead?.id ?? null} />
        </div>

        <MadeBy footer={settings.footer || hostOf(siteUrl)} />
      </div>
    </main>
  );
}
