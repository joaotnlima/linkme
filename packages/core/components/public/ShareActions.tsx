"use client";

import { useState } from "react";

export function ShareActions({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {}
  }
  return (
    <div className="flex gap-2.5 w-full">
      <button type="button" onClick={copy} className="flex-1 h-12 rounded-2xl border border-line bg-card font-semibold cursor-pointer">{copied ? "Copied" : "Copy link"}</button>
      {canShare ? <button type="button" onClick={share} className="flex-1 h-12 rounded-2xl bg-accent text-white font-semibold cursor-pointer">Share…</button> : null}
    </div>
  );
}
