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

export function DesignControls({ settings }: { settings: Settings }) {
  const [style, setStyle] = useState(settings.buttonStyle as "solid" | "glass" | "outline");
  const [radius, setRadius] = useState(settings.buttonRadius as "sharp" | "rounded" | "pill");
  const [shape, setShape] = useState(settings.profileShape as "circle" | "rounded" | "squircle" | "burst");
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Design</span>

      <label className="flex flex-col gap-1.5">
        <Label>Header layout</Label>
        <select name="layout" defaultValue={settings.layout} className={inputCls}>
          <option value="editorial">Editorial — photo + one button</option>
          <option value="classic">Classic — centered list</option>
        </select>
      </label>
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

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5"><Label>Body font</Label><input name="fontBody" list="gfonts" defaultValue={settings.fontBody} placeholder="Default (system)" autoComplete="off" spellCheck={false} className={inputCls} /></label>
          <label className="flex flex-col gap-1.5"><Label>Heading font</Label><input name="fontHeading" list="gfonts" defaultValue={settings.fontHeading} placeholder="Default (system)" autoComplete="off" spellCheck={false} className={inputCls} /></label>
        </div>
        <datalist id="gfonts">{POPULAR_FONTS.map((fo) => <option key={fo} value={fo} />)}</datalist>
        <span className="text-xs text-muted">Type any <a href="https://fonts.google.com" target="_blank" rel="noopener" className="underline">Google font</a> name (e.g. “Poppins”), or leave blank for the system font.</span>
      </div>
    </div>
  );
}
