"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs, defaultId }: { tabs: { id: string; name: string; content: ReactNode }[]; defaultId: string }) {
  const [active, setActive] = useState(defaultId);
  if (tabs.length <= 1) return <>{tabs[0]?.content}</>;
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Sections" className="grid gap-1 p-1 rounded-2xl bg-tile" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`h-10 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${on ? "bg-card text-ink shadow-sm" : "text-muted"}`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" hidden={t.id !== active} className="flex flex-col gap-3">
          {t.content}
        </div>
      ))}
    </div>
  );
}
