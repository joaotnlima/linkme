"use client";

import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS, DEFAULT_BACKGROUND, type BackgroundKey } from "@/components/public/backgrounds";

// Live, theme-aware background picker. Each tile renders the real background so
// what you pick is what the homepage shows. Writes the choice to a hidden input
// that submits with the Look form (name="background").
export function BackgroundPicker({ value }: { value?: string | null }) {
  const initial = (BACKGROUNDS.some((b) => b.key === value) ? value : DEFAULT_BACKGROUND) as BackgroundKey;
  const [selected, setSelected] = useState<BackgroundKey>(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.dispatchEvent(new Event("input", { bubbles: true })); }, [selected]);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">Background</span>
      <input ref={ref} type="hidden" name="background" value={selected} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {BACKGROUNDS.map(({ key, label, Component }) => {
          const on = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-pressed={on}
              className={`relative h-20 rounded-xl overflow-hidden bg-bg border text-left transition cursor-pointer ${on ? "border-accent ring-2 ring-accent" : "border-line hover:border-muted"}`}
            >
              <Component />
              <span className="absolute bottom-1 left-1.5 z-10 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-card/80 text-ink backdrop-blur-sm">{label}</span>
              {on ? <span className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">✓</span> : null}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-muted">Pick a motion background. All adapt to light &amp; dark; motion is disabled for visitors who prefer reduced motion.</span>
    </div>
  );
}
