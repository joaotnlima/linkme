/* eslint-disable @next/next/no-img-element */
import type { Feed, Link, Post, Settings } from "@/lib/db/schema";
import { Background } from "./Background";
import { Customize, customMainProps } from "./Customize";
import { ProfileHeader } from "./ProfileHeader";
import { ThemeToggle } from "./ThemeToggle";
import { CopyButton } from "./CopyButton";
import { LinkIcon } from "./Icon";
import { hostOf } from "@/lib/slug";
import { embedFor } from "@/lib/embed";
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
    <div className={`card-hover cz-radius cz-surface flex items-stretch rounded-2xl border ${featured ? "cz-featured bg-accent-soft border-accent min-h-[72px]" : "bg-card border-line min-h-14"}`}>
      <a href={href} rel="noopener" className={`flex-1 min-w-0 flex items-center gap-3 ${featured ? "py-3 pl-3.5 pr-2" : "py-2 pl-3.5 pr-2"}`}>
        <LinkIcon title={link.title} iconUrl={link.iconUrl} iconEmoji={link.iconEmoji} url={link.url} />
        <span className="flex flex-col min-w-0">
          <span className={`font-semibold leading-snug ${featured ? "text-[17px]" : "text-base"}`}>{link.title}</span>
          {link.subtitle ? <span className="text-[13px] leading-[18px] text-muted truncate">{link.subtitle}</span> : null}
        </span>
      </a>
      <CopyButton url={link.url} campaign={link.slug} label={link.title} />
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

/** A single feed entry: a playable YouTube/Spotify embed when the URL supports it, else a post card. */
function FeedItem({ post }: { post: Post }) {
  const em = embedFor(post.url);
  if (em?.provider === "youtube") {
    const src = post.autoplay ? `${em.src}?autoplay=1&mute=1&playsinline=1` : em.src;
    return (
      <div className="-mx-4 sm:mx-0 overflow-hidden sm:rounded-2xl border-y sm:border border-line bg-black">
        <iframe src={src} title={post.title || em.title} loading="lazy" allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="block w-full aspect-video" />
      </div>
    );
  }
  if (em?.provider === "spotify") {
    // Full-bleed on mobile: Spotify collapses to its compact "preview" player when the
    // iframe is too narrow, so give it the full screen width on small devices.
    return (
      <div className="-mx-4 sm:mx-0">
        <iframe src={em.src} title={post.title || em.title} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="block w-full sm:rounded-2xl border-0" style={{ height: em.height }} />
      </div>
    );
  }
  return <PostCard post={post} />;
}

/** Big hero card for the first item of a "showcase" feed (used when it is not an embed). */
function BigPostCard({ post }: { post: Post }) {
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="card-hover block rounded-2xl border border-line bg-card overflow-hidden">
      <div className="aspect-[16/10] bg-tile overflow-hidden flex items-center justify-center text-muted">
        {post.imageUrl ? <img src={post.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l5-5 4 4 3-3 6 6" /></svg>}
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <span className="text-[15px] font-semibold line-clamp-1">{post.title || post.excerpt || hostOf(post.url)}</span>
      </div>
    </a>
  );
}

/** Renders a feed in its chosen layout: list, grid, carousel or showcase. */
function FeedBlock({ feed, items }: { feed: Feed; items: Post[] }) {
  let body: React.ReactNode;
  if (feed.style === "grid") {
    body = <PostGrid posts={items} />;
  } else if (feed.style === "carousel") {
    body = (
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => <div key={p.id} className="snap-start shrink-0 w-[78%]"><FeedItem post={p} /></div>)}
      </div>
    );
  } else if (feed.style === "showcase") {
    const [first, ...rest] = items;
    body = (
      <div className="flex flex-col gap-2.5">
        {embedFor(first.url) ? <FeedItem post={first} /> : <BigPostCard post={first} />}
        {rest.map((p) => <FeedItem key={p.id} post={p} />)}
      </div>
    );
  } else {
    body = <div className="flex flex-col gap-2.5">{items.map((p) => <FeedItem key={p.id} post={p} />)}</div>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>{feed.title}</SectionLabel>
      {body}
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
        return <FeedBlock key={f.id} feed={f} items={items} />;
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

export function PublicPage({ settings, feeds, links, posts, qrSvg, siteUrl, forceLayout }: PageData & { forceLayout?: string }) {
  const activeLayout = forceLayout ?? settings.layout;
  const fullBleed = ["hero", "banner", "callout"].includes(activeLayout);
  const share = (
    <div className={fullBleed ? "absolute top-4 right-4 z-20 flex gap-2.5" : "flex justify-end gap-2.5"}>
      <ShareCard url={siteUrl} qrSvg={qrSvg} name={settings.displayName} bio={settings.bio} avatarUrl={settings.avatarUrl} initials={initials(settings.displayName)} />
      <ThemeToggle />
    </div>
  );
  return (
    <main {...customMainProps(settings)} className="relative flex-1 overflow-hidden" data-theme-default={settings.themeDefault}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme-default',${JSON.stringify(settings.themeDefault)})` }} />
      <Customize settings={settings} />
      <Background variant={settings.background} />
      <div className="relative z-10 mx-auto w-full max-w-[640px] pb-10 flex flex-col gap-5 md:gap-6">
        {fullBleed ? (
          <ProfileHeader settings={settings} share={share} layout={activeLayout} />
        ) : (
          <div className="px-4 pt-5 md:px-6 md:pt-8 flex flex-col gap-5 md:gap-6">
            {share}
            <ProfileHeader settings={settings} layout={activeLayout} />
          </div>
        )}
        <div className="px-4 md:px-6 flex flex-col gap-5 md:gap-6">
          <Socials links={links} />
          <PublicBody feeds={feeds} links={links} posts={posts} />
          <MadeBy footer={settings.footer || hostOf(siteUrl)} />
        </div>
      </div>
    </main>
  );
}
