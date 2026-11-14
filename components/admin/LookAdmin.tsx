"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { Feed, Link, Post, Settings } from "@/lib/db/schema";
import { addPostByUrl, deleteFeed, deletePost, moveFeed, refetchPost, setAvatar, syncInstagram, updatePost, updateSettings, upsertFeed } from "@/lib/actions";
import { ActionButton, ActionForm, Field, Status, Toggle, inputCls } from "./ui";
import { BackgroundPicker } from "./BackgroundPicker";
import { DesignControls } from "./DesignControls";
import { LivePreview } from "./LivePreview";
import { hostOf } from "@/lib/slug";

type Props = { settings: Settings; feeds: Feed[]; links: Link[]; posts: Post[]; hasInstagram: boolean };

const sectionCls = "text-xs font-semibold uppercase tracking-[0.08em] text-muted pt-3 px-1";
const cardCls = "rounded-2xl border border-line bg-card p-4 flex flex-col gap-3";

export function LookAdmin({ settings, feeds, links, posts, hasInstagram }: Props) {
  const [feedEditing, setFeedEditing] = useState<Feed | "new" | null>(null);
  const [postEditing, setPostEditing] = useState<Post | null>(null);
  const [tab, setTab] = useState<"content" | "design">("content");
  const initials = settings.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

  return (
    <div className="look-wide xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8 xl:items-start">
     <div className="flex flex-col gap-3 min-w-0">
      <div className="flex gap-1 bg-card border border-line rounded-full p-1 self-start text-sm font-semibold">
        <button type="button" onClick={() => setTab("content")} aria-current={tab === "content"} className={`h-9 px-5 rounded-full cursor-pointer ${tab === "content" ? "bg-ink text-bg" : "text-muted"}`}>Content</button>
        <button type="button" onClick={() => setTab("design")} aria-current={tab === "design"} className={`h-9 px-5 rounded-full cursor-pointer ${tab === "design" ? "bg-ink text-bg" : "text-muted"}`}>Design</button>
      </div>
      {tab === "content" ? (
      <div className={cardCls}>
        <div className="flex items-center gap-3.5">
          {settings.avatarUrl ? <img src={settings.avatarUrl} alt="" className="w-[72px] h-[72px] rounded-full object-cover shrink-0" /> : <div className="w-[72px] h-[72px] rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold shrink-0">{initials}</div>}
          <ActionForm action={setAvatar} className="flex flex-col gap-2 min-w-0">
            {(state, pending) => (
              <>
                <span className="text-sm font-semibold">Profile photo</span>
                <span className="text-xs text-muted">Square works best · ≤ 2 MB</span>
                <div className="flex gap-2 flex-wrap items-center">
                  <label className="h-9 px-3 rounded-xl bg-ink text-bg text-[13px] font-semibold flex items-center cursor-pointer">
                    {pending ? "Uploading…" : "Choose photo"}
                    <input type="file" name="avatar" accept="image/*" className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
                  </label>
                  {settings.avatarUrl ? <button type="submit" name="clear" value="1" className="h-9 px-3 rounded-xl border border-line text-[13px] font-medium cursor-pointer">Use initials</button> : null}
                  <Status state={state} />
                </div>
              </>
            )}
          </ActionForm>
        </div>
      </div>
      ) : null}

      <ActionForm id="look-form" action={updateSettings} className="flex flex-col gap-3.5">
        {(state, pending) => {
          const f = state && !state.ok ? state.fields ?? {} : {};
          return (
            <>
              <div className={tab === "content" ? "flex flex-col gap-3.5" : "hidden"}>
                <Field label="Display name" name="displayName" error={f.displayName}><input id="displayName" name="displayName" defaultValue={settings.displayName} className={inputCls} required maxLength={80} /></Field>
                <Field label="Bio (≤ 160)" name="bio" error={f.bio}><textarea id="bio" name="bio" defaultValue={settings.bio ?? ""} rows={2} maxLength={160} className={`${inputCls} h-auto py-3 resize-none`} /></Field>
                <Field label="Tagline" name="tagline" error={f.tagline}><textarea id="tagline" name="tagline" defaultValue={settings.tagline ?? ""} rows={2} maxLength={200} className={`${inputCls} h-auto py-3 resize-none`} /></Field>
                <Field label="Quote (small, italic)" name="quote" error={f.quote}><input id="quote" name="quote" defaultValue={settings.quote ?? ""} maxLength={200} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Page layout" name="layout">
                    <select id="layout" name="layout" defaultValue={settings.layout} className={inputCls}><option value="editorial">Editorial (photo + one button)</option><option value="classic">Classic (centered list)</option></select>
                  </Field>
                  <Field label="Primary button (lead link)" name="leadLinkId">
                    <select id="leadLinkId" name="leadLinkId" defaultValue={settings.leadLinkId ?? ""} className={inputCls}><option value="">None</option>{links.filter((l) => l.display !== "icon").map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Button label" name="ctaLabel" error={f.ctaLabel}><input id="ctaLabel" name="ctaLabel" defaultValue={settings.ctaLabel ?? ""} maxLength={40} placeholder="defaults to the link title" className={inputCls} /></Field>
                  <Field label="Site title (browser / share)" name="siteTitle" error={f.siteTitle}><input id="siteTitle" name="siteTitle" defaultValue={settings.siteTitle ?? ""} maxLength={80} className={inputCls} /></Field>
                </div>
                <Field label="Share description" name="siteDescription" error={f.siteDescription}><input id="siteDescription" name="siteDescription" defaultValue={settings.siteDescription ?? ""} maxLength={200} className={inputCls} /></Field>
                <Field label="Footer text" name="footer" error={f.footer}><input id="footer" name="footer" defaultValue={settings.footer ?? ""} maxLength={80} className={inputCls} /></Field>
              </div>
              <div className={tab === "design" ? "flex flex-col gap-3.5" : "hidden"}>
                <Field label="Default theme" name="themeDefault">
                  <select id="themeDefault" name="themeDefault" defaultValue={settings.themeDefault} className={inputCls}><option value="auto">Auto (by local time)</option><option value="light">Light</option><option value="dark">Dark</option></select>
                </Field>
                <DesignControls settings={settings} />
                <BackgroundPicker value={settings.background} />
              </div>
              <div className="flex items-center gap-3 pt-1"><button type="submit" disabled={pending} className="h-12 px-5 rounded-2xl bg-accent text-white font-semibold disabled:opacity-60 cursor-pointer">{pending ? "Saving…" : "Save & publish"}</button><Status state={state} /></div>
            </>
          );
        }}
      </ActionForm>

      {tab === "content" ? (<>
      <div className="flex items-center justify-between"><span className={sectionCls}>Feeds</span><button type="button" onClick={() => setFeedEditing("new")} className="h-8 px-2.5 rounded-lg border border-line bg-card text-[13px] font-semibold cursor-pointer">+ Add feed</button></div>
      {feeds.length === 0 ? <p className="text-sm text-muted px-1">No feeds. Add one to show your latest posts under the links.</p> : null}
      {feeds.map((f, i) => {
        const list = posts.filter((p) => p.feedId === f.id);
        return (
          <div key={f.id} className={`${cardCls} ${f.enabled ? "" : "opacity-70"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{f.title}</span>
              <span className="text-xs text-muted">{f.source === "instagram_graph" ? `Instagram sync${hasInstagram ? "" : " · token missing"}` : "paste URLs"} · {f.style}{f.enabled ? "" : " · hidden"}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setFeedEditing(f)} className="h-9 px-3 rounded-xl border border-line text-[13px] font-semibold cursor-pointer">Edit</button>
              <ActionButton run={() => moveFeed(f.id, "up")} className={`h-9 w-9 rounded-xl border border-line text-[13px] ${i === 0 ? "invisible" : ""}`}>▲</ActionButton>
              <ActionButton run={() => moveFeed(f.id, "down")} className={`h-9 w-9 rounded-xl border border-line text-[13px] ${i === feeds.length - 1 ? "invisible" : ""}`}>▼</ActionButton>
              {f.source === "instagram_graph" ? <ActionButton run={() => syncInstagram(f.id)} className="h-9 px-3 rounded-xl border border-line text-[13px] font-semibold">Sync now</ActionButton> : null}
              <ActionButton run={() => deleteFeed(f.id)} confirm={`Delete feed "${f.title}" and its ${list.length} posts?`} className="h-9 px-3 rounded-xl text-[13px] font-semibold text-[#B45309]">Delete</ActionButton>
            </div>
            {f.source === "manual" ? (
              <ActionForm action={addPostByUrl} className="flex gap-2">
                {(state, pending) => (
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex gap-2">
                      <input type="hidden" name="feedId" value={f.id} />
                      <input name="url" type="url" required placeholder="Paste a post URL" className={inputCls} />
                      <button type="submit" disabled={pending} className="h-12 px-4 rounded-xl bg-ink text-bg font-semibold shrink-0 disabled:opacity-60 cursor-pointer">{pending ? "Fetching…" : "Add"}</button>
                    </div>
                    <Status state={state} />
                  </div>
                )}
              </ActionForm>
            ) : null}
            <div className="rounded-2xl border border-line bg-bg overflow-hidden">
              {list.length === 0 ? <p className="p-3.5 text-sm text-muted">No posts yet.</p> : null}
              {list.map((p, j) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 ${j ? "border-t border-line" : ""} ${p.enabled ? "" : "opacity-60"}`}>
                  <div className="w-10 h-10 rounded-lg bg-tile overflow-hidden shrink-0">{p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : null}</div>
                  <button type="button" onClick={() => setPostEditing(p)} className="flex-1 min-w-0 text-left flex flex-col cursor-pointer">
                    <span className="text-sm font-medium truncate">{p.title || p.excerpt || p.url}</span>
                    <span className={`text-xs ${!p.title && !p.excerpt ? "text-[#B45309]" : "text-muted"}`}>
                      {hostOf(p.url)}{p.publishedAt ? ` · ${p.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""} · {p.source === "og" ? "preview fetched" : p.source === "instagram_graph" ? "synced" : !p.title && !p.excerpt ? "preview blocked — add a title" : "manual"}
                    </span>
                  </button>
                  <ActionButton run={() => deletePost(p.id)} confirm="Remove this post from the feed?" className="w-9 h-9 rounded-lg text-muted">✕</ActionButton>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </>) : null}

      {feedEditing ? (
        <Modal onClose={() => setFeedEditing(null)} title={feedEditing === "new" ? "New feed" : "Edit feed"}>
          <ActionForm action={upsertFeed} className="flex flex-col gap-3.5" onDone={(r) => { if (r.ok) setFeedEditing(null); }}>
            {(state, pending) => {
              const f = feedEditing === "new" ? null : feedEditing;
              return (
                <>
                  {f ? <input type="hidden" name="id" value={f.id} /> : null}
                  <Field label="Title (shown on the page)" name="title"><input id="title" name="title" required maxLength={60} defaultValue={f?.title ?? ""} placeholder="Latest on LinkedIn" className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Source" name="source">
                      <select id="source" name="source" defaultValue={f?.source ?? "manual"} className={inputCls}><option value="manual">Paste URLs (any site)</option><option value="instagram_graph">Instagram sync</option></select>
                    </Field>
                    <Field label="Style" name="style">
                      <select id="style" name="style" defaultValue={f?.style ?? "cards"} className={inputCls}><option value="cards">Cards (title · date)</option><option value="grid">Image grid (3 columns)</option></select>
                    </Field>
                  </div>
                  <Toggle name="enabled" defaultChecked={f?.enabled ?? true} label="Show on the page" />
                  <button type="submit" disabled={pending} className="h-12 rounded-2xl bg-accent text-white font-semibold disabled:opacity-60 cursor-pointer">{pending ? "Saving…" : "Save"}</button>
                  <Status state={state} />
                </>
              );
            }}
          </ActionForm>
        </Modal>
      ) : null}

      {postEditing ? (
        <Modal onClose={() => setPostEditing(null)} title="Edit post">
          <ActionForm action={updatePost} className="flex flex-col gap-3.5" onDone={(r) => { if (r.ok) setPostEditing(null); }}>
            {(state, pending) => (
              <>
                <input type="hidden" name="id" value={postEditing.id} />
                <Field label="Post URL" name="url"><input id="url" name="url" type="text" inputMode="url" required defaultValue={postEditing.url} className={inputCls} /></Field>
                <Field label="Title" name="title"><input id="title" name="title" maxLength={200} defaultValue={postEditing.title ?? ""} className={inputCls} /></Field>
                <Field label="Excerpt" name="excerpt"><textarea id="excerpt" name="excerpt" rows={3} maxLength={400} defaultValue={postEditing.excerpt ?? ""} className={`${inputCls} h-auto py-3`} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Image URL" name="imageUrl"><input id="imageUrl" name="imageUrl" type="url" defaultValue={postEditing.imageUrl ?? ""} className={inputCls} /></Field>
                  <Field label="…or upload an image" name="image"><input id="image" name="image" type="file" accept="image/*" className="h-12 w-full text-sm file:mr-3 file:h-12 file:px-3 file:rounded-xl file:border file:border-line file:bg-card file:text-ink file:font-semibold" /></Field>
                </div>
                <p className="text-xs text-muted">LinkedIn hides post previews from non-browsers; a screenshot of the post works well as the image.</p>
                <Toggle name="enabled" defaultChecked={postEditing.enabled} label="Show in feed" />
                <div className="flex gap-2">
                  <button type="submit" disabled={pending} className="flex-1 h-12 rounded-2xl bg-accent text-white font-semibold disabled:opacity-60 cursor-pointer">{pending ? "Saving…" : "Save"}</button>
                  <ActionButton run={() => refetchPost(postEditing.id).then((r) => { if (r.ok) setPostEditing(null); return r; })} className="h-12 px-4 rounded-2xl border border-line font-semibold">Re-fetch preview</ActionButton>
                </div>
                <p className="text-xs text-muted">Save first if you changed the URL, then re-fetch.</p>
                <Status state={state} />
              </>
            )}
          </ActionForm>
        </Modal>
      ) : null}
     </div>
     <aside className="hidden xl:block xl:sticky xl:top-4">
       <LivePreview settings={settings} links={links} />
     </aside>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end md:items-center md:justify-center bg-black/55" onClick={onClose}>
      <div className="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto bg-card text-ink rounded-t-3xl md:rounded-2xl p-4 pb-8 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-bg cursor-pointer">✕</button></div>
        {children}
      </div>
    </div>
  );
}
