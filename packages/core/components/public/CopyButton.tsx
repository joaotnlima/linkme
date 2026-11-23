"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { withUtms, hostOf } from "@/lib/slug";

// Copies the real destination URL (not the /go tracking link) with UTM params so
// the owner can see the click came from their page wherever the link is pasted.
// On click it also opens a modal with that link's own QR code while a toast
// confirms the copy — handy on mobile where there is no hover affordance.
export function CopyButton({ url, campaign, label }: { url: string; campaign?: string; label: string }) {
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copiedUrlRef = useRef<string>(url);
  // On touch devices, closing the overlay emits a synthetic click ~300ms later
  // at the same spot — which lands on the now-exposed copy icon and reopens the
  // modal (a flicker). Ignore any reopen within a short window after a close.
  const reopenGuardUntil = useRef(0);

  const host = hostOf(url);

  function close() {
    setOpen(false);
    reopenGuardUntil.current = Date.now() + 400;
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
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
    if (Date.now() < reopenGuardUntil.current) return; // swallow the post-close ghost click
    const abs = withUtms(url, window.location.hostname.replace(/^www\./, ""), campaign);
    copiedUrlRef.current = abs;
    // Copy to the clipboard in the background …
    try {
      await navigator.clipboard.writeText(abs);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } catch {}
    // … and surface this link's own QR code in a modal. `qrcode` is loaded
    // lazily (a separate chunk) only on the first copy, so it never weighs on
    // the initial page bundle.
    try {
      const { default: QRCode } = await import("qrcode");
      const svg = await QRCode.toString(abs, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#16161a", light: "#ffffff00" } });
      setQrSvg(svg.replace("<svg ", '<svg aria-hidden="true" '));
    } catch {
      setQrSvg(null);
    }
    setOpen(true);
  }

  return (
    <>
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

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55" onClick={close}>
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`QR code for ${label}`} onClick={(e) => e.stopPropagation()} className="share-pop relative w-full max-w-[350px] rounded-[28px] bg-card border border-line p-6 flex flex-col items-center gap-[18px] text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)] outline-none">
            <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 w-9 h-9 rounded-full bg-bg text-muted flex items-center justify-center cursor-pointer">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h2 className="text-xl font-bold leading-tight px-4">{label}</h2>
            <div className="w-[240px] h-[240px] rounded-[18px] bg-white p-4 border border-line flex items-center justify-center" role="img" aria-label={`QR code for ${label}`}>
              {qrSvg ? (
                <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              ) : (
                <span className="text-sm text-muted">Generating…</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
              {host}
            </div>
            <p className="text-xs text-muted">Link copied — point a camera at the code to open it</p>
          </div>
        </div>,
        document.body,
      ) : null}

      {toast && typeof document !== "undefined" ? createPortal(
        <div role="status" aria-live="polite" className="fixed left-1/2 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-ink text-bg px-4 py-2.5 text-sm font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.3)] pointer-events-none">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          Link copied to clipboard
        </div>,
        document.body,
      ) : null}
    </>
  );
}
