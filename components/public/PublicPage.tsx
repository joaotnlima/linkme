/* eslint-disable @next/next/no-img-element */
import type { Feed, Link, Post, Settings } from "@/lib/db/schema";
import { Background } from "./Background";
import { ThemeToggle } from "./ThemeToggle";
import { CopyButton } from "./CopyButton";
import { LinkIcon } from "./Icon";
import { hostOf } from "@/lib/slug";
import { ShareCard } from "./ShareCard";
import { MadeBy } from "./MadeBy";

export type PageData = { settings: Settings; feeds: Feed[]; links: Link[]; posts: Post[]; qrSvg: string; siteUrl: string };

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted pt-2 px-1">{children}</div>;
}

export function Card({ link, featured }: { link: Link; featured: boolean }) {
  const href = `/go/${link.slug}`;
  return (
    <div className={`card-hover flex items-stretch rounded-2xl border ${featured ? "bg-accent-soft border-accent min-h-[72px]" : "bg-card border-line min-h-14"}`}>
      <a href={href} rel="noopener" className={`flex-1 min-w-0 flex items-center gap-3 ${featured ? "py-3 pl-3.5 pr-2" : "py-2 pl-3.5 pr-2"}`}>
        <LinkIcon title={link.title} iconUrl={link.iconUrl} iconEmoji={link.iconEmoji} url={link.url} />
        <span className="flex flex-col min-w-0">
          <span className={`font-semibold leading-snug ${featured ? "text-[17px]" : "text-base"}`}>{link.title}</span>
          {link.subtitle ? <span className="text-[13px] leading-[18px] text-muted truncate">{link.subtitle}</span> : null}
        </span>
      </a>
      <CopyButton href={href} label={link.title} />
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const platform = post.platform === "linkedin" ? "LinkedIn" : post.platform === "instagram" ? "Instagram" : hostOf(post.url);
  const date = post.publishedAt ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(post.publishedAt) : null;
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="card-hover flex gap-3 rounded-2xl border border-line bg-card p-3">
      <div className="w-14 h-14 rounded-xl bg-tile shrink-0 overflow-hidden flex items-center justify-center text-muted">
        {post.imageUrl ? <img src={post.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l5-5 4 4 3-3 6 6" /></svg>}
      </div>
      <span className="flex flex-col gap-1 min-w-0">
        <span className="text-sm leading-5 line-clamp-2">{post.title || post.excerpt || post.url}</span>
        <span className="text-xs text-muted"><b className="text-ink">{platform}</b>{date ? ` · ${date}` : ""}</span>
      </span>
    </a>
  );
}

function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {posts.map((p) => (
        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={p.title || p.excerpt || "Post"} className="aspect-square rounded-xl bg-tile overflow-hidden flex items-center justify-center text-muted">
          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l5-5 4 4 3-3 6 6" /></svg>}
        </a>
      ))}
    </div>
  );
}

/** Links grouped by section label (in position order), then feeds. Shared by both layouts. */
export function PublicBody({ feeds, links, posts, excludeLinkId }: Pick<PageData, "feeds" | "links" | "posts"> & { excludeLinkId?: string | null }) {
  const cards = links.filter((l) => l.display !== "icon" && l.id !== excludeLinkId);
  const sections: { name: string | null; items: Link[] }[] = [];
  for (const l of cards) {
    const last = sections[sections.length - 1];
    if (last && last.name === (l.section || null)) last.items.push(l);
    else sections.push({ name: l.section || null, items: [l] });
  }
  return (
    <>
      {sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          {s.name ? <SectionLabel>{s.name}</SectionLabel> : null}
          {s.items.map((l) => <Card key={l.id} link={l} featured={l.display === "featured"} />)}
        </div>
      ))}
      {feeds.map((f) => {
        const items = posts.filter((p) => p.feedId === f.id && p.enabled);
        if (!items.length) return null;
        return (
          <div key={f.id} className="flex flex-col gap-2.5">
            <SectionLabel>{f.title}</SectionLabel>
            {f.style === "grid" ? <PostGrid posts={items} /> : items.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        );
      })}
      {!cards.length && !feeds.length ? <p className="text-center text-muted text-sm">Nothing here yet. Add links in /admin.</p> : null}
    </>
  );
}

export function Socials({ links }: { links: Link[] }) {
  const socials = links.filter((l) => l.display === "icon");
  if (!socials.length) return null;
  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {socials.map((s) => (
        <a key={s.id} href={`/go/${s.slug}`} aria-label={s.title} title={s.title} className="w-11 h-11 rounded-full bg-card border border-line flex items-center justify-center text-ink overflow-hidden">
          <LinkIcon title={s.title} iconUrl={s.iconUrl} iconEmoji={s.iconEmoji} url={s.url} size={44} round />
        </a>
      ))}
    </div>
  );
}

export function PublicPage({ settings, feeds, links, posts, qrSvg, siteUrl }: PageData) {
  return (
    <main className="relative flex-1 overflow-hidden" data-theme-default={settings.themeDefault}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme-default',${JSON.stringify(settings.themeDefault)})` }} />
      <Background variant={settings.background} />
      <div className="relative z-10 mx-auto w-full max-w-[640px] px-4 pt-5 pb-10 md:px-6 md:pt-8 flex flex-col gap-5 md:gap-6">
        <div className="flex justify-end gap-2.5"><ShareCard url={siteUrl} qrSvg={qrSvg} name={settings.displayName} bio={settings.bio} avatarUrl={settings.avatarUrl} initials={initials(settings.displayName)} /><ThemeToggle /></div>
        <header className="flex flex-col items-center gap-2.5 text-center">
          {settings.avatarUrl ? (
            <img src={settings.avatarUrl} alt="" width={112} height={112} className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" />
          ) : (
            <div aria-hidden="true" className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-accent text-white flex items-center justify-center text-4xl font-bold">{initials(settings.displayName)}</div>
          )}
          <h1 className="text-[22px] md:text-[26px] font-bold leading-tight">{settings.displayName}</h1>
          {settings.bio ? <p className="text-[15px] md:text-base leading-relaxed text-muted max-w-[420px]">{settings.bio}</p> : null}
          {settings.tagline ? <p className="mt-1 text-sm md:text-base font-medium max-w-[460px]">{settings.tagline}</p> : null}
          {settings.quote ? <p className="text-xs md:text-[13px] italic text-muted max-w-[460px]">{settings.quote}</p> : null}
        </header>
        <Socials links={links} />
        <PublicBody feeds={feeds} links={links} posts={posts} />
        <MadeBy footer={settings.footer || hostOf(siteUrl)} />
      </div>
    </main>
  );
}
