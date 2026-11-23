"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

type Props = { url: string; qrSvg: string; name: string; bio: string | null; avatarUrl: string | null; initials: string };

/** Icon button next to the theme toggle; opens a dialog with the QR code, link and share actions. */
export function ShareCard({ url, qrSvg, name, bio, avatarUrl, initials }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const host = url.replace(/^https?:\/\//, "");

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  async function share() {
    try {
      await navigator.share({ title: name, url });
    } catch {}
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Show QR code to share this page" title="Share / QR" className="w-11 h-11 rounded-full border border-line bg-card text-ink flex items-center justify-center cursor-pointer">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v3M17 21h4M14 21h.01" /></svg>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55" onClick={() => setOpen(false)}>
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Share this page" onClick={(e) => e.stopPropagation()} className="share-pop relative w-full max-w-[350px] rounded-[28px] bg-card border border-line p-6 flex flex-col items-center gap-[18px] text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)] outline-none">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 w-9 h-9 rounded-full bg-bg text-muted flex items-center justify-center cursor-pointer">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" /> : <div aria-hidden="true" className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold">{initials}</div>}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold leading-tight">{name}</h2>
              {bio ? <p className="text-sm text-muted">{bio}</p> : null}
            </div>
            <div className="w-[240px] h-[240px] rounded-[18px] bg-white p-4 border border-line" role="img" aria-label={`QR code for ${url}`}>
              <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
              {host}
            </div>
            <div className="flex gap-2.5 w-full">
              <button type="button" onClick={copy} className="flex-1 h-12 rounded-2xl border border-line bg-card font-semibold cursor-pointer">{copied ? "Copied" : "Copy link"}</button>
              {canShare ? <button type="button" onClick={share} className="flex-1 h-12 rounded-2xl bg-accent text-white font-semibold cursor-pointer">Share…</button> : null}
            </div>
            <p className="text-xs text-muted">Point a camera at the code to open the page</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
