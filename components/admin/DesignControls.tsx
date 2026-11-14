"use client";

import { useState } from "react";
import type { Settings } from "@/lib/db/schema";
import { FONTS } from "@/lib/font-options";
import { inputCls } from "./ui";

function Segmented<T extends string>({ name, value, onChange, options }: { name: string; value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="flex bg-bg border border-line rounded-xl p-[3px] gap-[3px]">
      <input type="hidden" name={name} value={value} />
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} aria-pressed={o.v === value}
          className={`flex-1 h-9 rounded-lg text-[13px] font-semibold capitalize transition cursor-pointer ${o.v === value ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Color({ name, label, initial, fallback }: { name: string; label: string; initial: string | null; fallback: string }) {
  const [v, setV] = useState((initial && /^#[0-9a-fA-F]{6}$/.test(initial) ? initial : fallback));
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

export function DesignControls({ settings }: { settings: Settings }) {
  const [style, setStyle] = useState(settings.buttonStyle as "solid" | "glass" | "outline");
  const [radius, setRadius] = useState(settings.buttonRadius as "sharp" | "rounded" | "pill");
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Design</span>

      <div className="grid grid-cols-2 gap-3">
        <Color name="accentLight" label="Accent · light" initial={settings.accentLight} fallback="#0e7c66" />
        <Color name="accentDark" label="Accent · dark" initial={settings.accentDark} fallback="#3ccba8" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Button style</span>
        <Segmented name="buttonStyle" value={style} onChange={setStyle} options={[{ v: "solid", label: "Solid" }, { v: "glass", label: "Glass" }, { v: "outline", label: "Outline" }]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Button roundness</span>
        <Segmented name="buttonRadius" value={radius} onChange={setRadius} options={[{ v: "sharp", label: "Sharp" }, { v: "rounded", label: "Rounded" }, { v: "pill", label: "Pill" }]} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Body font</span>
          <select name="fontBody" defaultValue={settings.fontBody} className={inputCls}>{FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Heading font</span>
          <select name="fontHeading" defaultValue={settings.fontHeading} className={inputCls}>{FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select>
        </label>
      </div>
    </div>
  );
}
