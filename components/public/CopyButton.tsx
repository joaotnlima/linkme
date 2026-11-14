"use client";

import { useState } from "react";
import { withUtms } from "@/lib/slug";

// Copies the real destination URL (not the /go tracking link) with UTM params so
// the owner can see the click came from their page wherever the link is pasted.
export function CopyButton({ url, campaign, label }: { url: string; campaign?: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      const abs = withUtms(url, window.location.hostname.replace(/^www\./, ""), campaign);
      await navigator.clipboard.writeText(abs);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? "Copied" : `Copy link to ${label}`}
      title={done ? "Copied" : "Copy link"}
      className="copy-btn w-12 shrink-0 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
    >
      {done ? (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
      ) : (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>
      )}
    </button>
  );
}
