"use client";

import { useState } from "react";
import type { Link } from "@/lib/db/schema";
import { createLink, updateLink, deleteLink, moveLink, setLinkEnabled } from "@/lib/actions";
import { ActionForm, ActionButton, Field, Status, Toggle, inputCls } from "./ui";
import { LinkIcon } from "@/components/public/Icon";
import { hostOf } from "@/lib/slug";

type Props = { links: Link[]; clicks: Record<string, number>; leadLinkId: string | null };

export function LinksAdmin({ links, clicks, leadLinkId }: Props) {
  const [editing, setEditing] = useState<Link | "new" | null>(null);
  const groups = [{ links }];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted px-1">Order here is the order on the page. Give links a section label to group them; set the primary button in Look.</p>
      {groups.map((g, gi) => (
        <section key={gi} className="flex flex-col gap-2.5">
          {g.links.length === 0 ? <p className="text-sm text-muted px-1">No links yet.</p> : null}
          {g.links.map((l, i) => (
            <div key={l.id} className={`flex items-center gap-2.5 rounded-2xl border bg-card p-2.5 min-h-16 ${l.enabled ? "border-line" : "border-dashed border-[#D2D0C8] opacity-70"}`}>
              <div className="flex flex-col gap-0.5 text-muted">
                <ActionButton run={() => moveLink(l.id, "up")} className={`w-7 h-5 rounded text-xs ${i === 0 ? "invisible" : ""}`}>▲</ActionButton>
                <ActionButton run={() => moveLink(l.id, "down")} className={`w-7 h-5 rounded text-xs ${i === g.links.length - 1 ? "invisible" : ""}`}>▼</ActionButton>
              </div>
              <LinkIcon title={l.title} iconUrl={l.iconUrl} iconEmoji={l.iconEmoji} url={l.url} />
              <button type="button" onClick={() => setEditing(l)} className="flex-1 min-w-0 text-left flex flex-col cursor-pointer">
                <span className="font-semibold truncate">{l.title}</span>
                <span className="text-[13px] text-muted truncate">
                  {hostOf(l.url)} · /go/{l.slug} · {clicks[l.id] ?? 0} clicks{l.display !== "card" ? ` · ${l.display}` : ""}{l.section ? ` · ${l.section}` : ""}{l.id === leadLinkId ? " · primary button" : ""}
                </span>
              </button>
              <ActionButton run={() => setLinkEnabled(l.id, !l.enabled)} className={`w-11 h-[26px] rounded-full relative shrink-0 ${l.enabled ? "bg-accent" : "bg-[#C9C7BF]"}`}>
                <span className="sr-only">{l.enabled ? "Disable" : "Enable"}</span>
                <span aria-hidden="true" className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all ${l.enabled ? "left-[21px]" : "left-[3px]"}`} />
              </ActionButton>
            </div>
          ))}
        </section>
      ))}

      <button type="button" onClick={() => setEditing("new")} aria-label="Add link" className="fixed md:static bottom-24 right-4 md:bottom-auto md:right-auto md:mt-2 w-14 h-14 md:w-auto md:h-11 md:px-4 rounded-full md:rounded-xl bg-accent text-white flex items-center justify-center gap-2 font-semibold shadow-lg md:shadow-none cursor-pointer z-10">
        <span className="text-2xl md:text-base leading-none">+</span><span className="hidden md:inline">Add link</span>
      </button>

      {editing ? <Editor link={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function Editor({ link, onClose }: { link: Link | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end md:items-center md:justify-center bg-black/55" onClick={onClose}>
      <div className="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto bg-card text-ink rounded-t-3xl md:rounded-2xl p-4 pb-8 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-line mx-auto mb-3 md:hidden" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{link ? "Edit link" : "New link"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-bg cursor-pointer">✕</button>
        </div>
        <ActionForm action={link ? updateLink : createLink} className="flex flex-col gap-3.5" onDone={(r) => { if (r.ok) onClose(); }}>
          {(state, pending) => {
            const f = state && !state.ok ? state.fields ?? {} : {};
            return (
              <>
                {link ? <input type="hidden" name="id" value={link.id} /> : null}
                <Field label="URL" name="url" error={f.url}>
                  <input id="url" name="url" type="text" inputMode="url" required defaultValue={link?.url ?? ""} placeholder="https://… or mailto:you@example.com" className={inputCls} />
                  {!link ? <span className="text-xs text-muted">The site icon is fetched after saving; you can override it with an emoji.</span> : null}
                </Field>
                <Field label="Title" name="title" error={f.title}>
                  <input id="title" name="title" type="text" required maxLength={120} defaultValue={link?.title ?? ""} className={inputCls} />
                </Field>
                <Field label="Subtitle (optional)" name="subtitle" error={f.subtitle}>
                  <input id="subtitle" name="subtitle" type="text" maxLength={160} defaultValue={link?.subtitle ?? ""} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Show as" name="display">
                    <select id="display" name="display" defaultValue={link?.display ?? "card"} className={inputCls}>
                      <option value="card">Card</option>
                      <option value="featured">Featured card</option>
                      <option value="icon">Social icon</option>
                    </select>
                  </Field>
                  <Field label="Section label" name="section" error={f.section}>
                    <input id="section" name="section" type="text" maxLength={60} defaultValue={link?.section ?? ""} placeholder="e.g. Now" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emoji icon (optional)" name="iconEmoji" error={f.iconEmoji}>
                    <input id="iconEmoji" name="iconEmoji" type="text" maxLength={8} defaultValue={link?.iconEmoji ?? ""} placeholder="🚀" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Image URL (optional)" name="imageUrl" error={f.imageUrl}>
                    <input id="imageUrl" name="imageUrl" type="text" inputMode="url" defaultValue={link?.imageUrl ?? ""} placeholder="https://… .png" className={inputCls} />
                  </Field>
                  <Field label="Image shows as" name="imageMode">
                    <select id="imageMode" name="imageMode" defaultValue={link?.imageMode ?? "icon"} className={inputCls}>
                      <option value="icon">Icon (default)</option>
                      <option value="thumbnail">Thumbnail (beside title)</option>
                      <option value="background">Background</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Button colour" name="styleBg">
                    <input id="styleBg" name="styleBg" type="text" maxLength={32} defaultValue={(link?.style as { bg?: string } | null)?.bg ?? ""} placeholder="#RRGGBB" className={inputCls} />
                  </Field>
                  <Field label="Text colour" name="styleText">
                    <input id="styleText" name="styleText" type="text" maxLength={32} defaultValue={(link?.style as { textColor?: string } | null)?.textColor ?? ""} placeholder="#RRGGBB" className={inputCls} />
                  </Field>
                  <Field label="Corner radius" name="styleRadius">
                    <input id="styleRadius" name="styleRadius" type="number" min={0} max={40} defaultValue={(link?.style as { radius?: number } | null)?.radius ?? undefined} placeholder="16" className={inputCls} />
                  </Field>
                </div>
                <Field label="Short link" name="slug" error={f.slug}>
                  <div className="flex items-center h-12 rounded-xl border border-line bg-card overflow-hidden">
                    <span className="pl-3.5 text-[15px] text-muted whitespace-nowrap">/go/</span>
                    <input id="slug" name="slug" type="text" defaultValue={link?.slug ?? ""} placeholder="auto from title" className="flex-1 min-w-0 h-full border-0 bg-transparent px-2 text-base" />
                  </div>
                </Field>
                <Toggle name="enabled" defaultChecked={link?.enabled ?? true} label="Visible on the page" />
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={pending} className="flex-1 h-[52px] rounded-2xl bg-accent text-white font-semibold disabled:opacity-60 cursor-pointer">{pending ? "Saving…" : "Save & publish"}</button>
                  {link ? (
                    <ActionButton run={() => deleteLink(link.id).then((r) => { if (r.ok) onClose(); return r; })} confirm="Delete this link and its click history?" className="h-[52px] px-4 rounded-2xl border border-line text-[#B45309] font-semibold">Delete</ActionButton>
                  ) : null}
                </div>
                <Status state={state} />
              </>
            );
          }}
        </ActionForm>
      </div>
    </div>
  );
}
