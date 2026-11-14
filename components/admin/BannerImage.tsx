"use client";

import { setBanner } from "@/lib/actions";
import { ActionForm, Status, inputCls } from "./ui";

// Banner image for the Banner header layout — set via URL or file upload.
export function BannerImage({ url }: { url: string | null }) {
  return (
    <ActionForm action={setBanner} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-4">
      {(state, pending) => (
        <>
          <span className="text-sm font-semibold text-ink">Banner image <span className="font-normal text-muted">· for the Banner header</span></span>
          {url ? <div className="w-full h-24 rounded-xl bg-tile bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} /> : null}
          <input name="url" type="url" defaultValue={url ?? ""} placeholder="Paste an image URL…" className={inputCls} />
          <div className="flex gap-2 flex-wrap items-center">
            <button type="submit" disabled={pending} className="h-9 px-3 rounded-xl bg-ink text-bg text-[13px] font-semibold disabled:opacity-60 cursor-pointer">{pending ? "Saving…" : "Use URL"}</button>
            <label className="h-9 px-3 rounded-xl border border-line text-[13px] font-semibold flex items-center cursor-pointer">
              Upload image
              <input type="file" name="banner" accept="image/*" className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
            </label>
            {url ? <button type="submit" name="clear" value="1" className="h-9 px-3 rounded-xl border border-line text-[13px] font-medium cursor-pointer">Remove</button> : null}
            <Status state={state} />
          </div>
        </>
      )}
    </ActionForm>
  );
}
