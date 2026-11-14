"use client";

import { useEffect, useRef, useState } from "react";
import type { Settings } from "@/lib/db/schema";
import { POPULAR_FONTS } from "@/lib/font-options";
import { inputCls } from "./ui";

// Hidden input driven by state — dispatches a bubbling `input` event on change so
// the live preview (which reads the form on input/change) updates instantly.
function Segmented<T extends string>({ name, value, onChange, options }: { name: string; value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.dispatchEvent(new Event("input", { bubbles: true })); }, [value]);
  return (
    <div className="flex bg-bg border border-line rounded-xl p-[3px] gap-[3px]">
      <input ref={ref} type="hidden" name={name} value={value} />
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} aria-pressed={o.v === value}
          className={`flex-1 h-9 rounded-lg text-[13px] font-semibold transition cursor-pointer ${o.v === value ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Color({ name, label, initial, fallback }: { name: string; label: string; initial: string | null; fallback: string }) {
  const [v, setV] = useState(initial && /^#[0-9a-fA-F]{6}$/.test(initial) ? initial : fallback);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" name={name} value={v} onChange={(e) => setV(e.target.value)} className="w-11 h-11 rounded-xl border border-line bg-card cursor-pointer p-1" aria-label={label} />
        <span className="text-[13px] font-mono text-muted">{v}</span>
      </span>
    </label>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <span className="text-sm font-semibold text-ink">{children}</span>;

// Font dropdown: Default, Mono, the popular Google fonts, plus any custom value already set.
function FontSelect({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const known = ["", "mono", ...POPULAR_FONTS];
  const extra = value && !known.includes(value) ? [value] : [];
  return (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Default (system)</option>
      <option value="mono">Monospace</option>
      {[...extra, ...POPULAR_FONTS].map((fo) => <option key={fo} value={fo} style={{ fontFamily: `'${fo}', sans-serif` }}>{fo}</option>)}
    </select>
  );
}

export function DesignControls({ settings }: { settings: Settings }) {
  const [style, setStyle] = useState(settings.buttonStyle as "solid" | "glass" | "outline");
  const [radius, setRadius] = useState(settings.buttonRadius as "sharp" | "rounded" | "pill");
  const [shape, setShape] = useState(settings.profileShape as "circle" | "rounded" | "squircle" | "burst");
  const [hDesktop, setHDesktop] = useState(settings.layout);
  const [hMobile, setHMobile] = useState(settings.layoutMobile);
  const [fontBody, setFontBody] = useState(settings.fontBody);
  const [fontHeading, setFontHeading] = useState(settings.fontHeading);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Design</span>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <Label>Header · Mobile</Label>
          <select name="layoutMobile" value={hMobile} onChange={(e) => setHMobile(e.target.value)} className={inputCls}>
            <option value="classic">Classic</option>
            <option value="hero">Hero</option>
            <option value="callout">Callout</option>
            <option value="banner">Banner</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <Label>Header · Desktop</Label>
          <select name="layout" value={hDesktop} onChange={(e) => setHDesktop(e.target.value)} className={inputCls}>
            <option value="editorial">Editorial</option>
            <option value="classic">Classic</option>
            <option value="hero">Hero</option>
            <option value="callout">Callout</option>
            <option value="banner">Banner</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Profile shape</Label>
        <Segmented name="profileShape" value={shape} onChange={setShape} options={[{ v: "circle", label: "Circle" }, { v: "rounded", label: "Rounded" }, { v: "squircle", label: "Squircle" }, { v: "burst", label: "Burst" }]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Color name="accentLight" label="Accent · light" initial={settings.accentLight} fallback="#0e7c66" />
        <Color name="accentDark" label="Accent · dark" initial={settings.accentDark} fallback="#3ccba8" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Button style</Label>
        <Segmented name="buttonStyle" value={style} onChange={setStyle} options={[{ v: "solid", label: "Solid" }, { v: "glass", label: "Glass" }, { v: "outline", label: "Outline" }]} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Button roundness</Label>
        <Segmented name="buttonRadius" value={radius} onChange={setRadius} options={[{ v: "sharp", label: "Sharp" }, { v: "rounded", label: "Rounded" }, { v: "pill", label: "Pill" }]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5"><Label>Body font</Label><FontSelect name="fontBody" value={fontBody} onChange={setFontBody} /></label>
        <label className="flex flex-col gap-1.5"><Label>Heading font</Label><FontSelect name="fontHeading" value={fontHeading} onChange={setFontHeading} /></label>
      </div>
    </div>
  );
}
