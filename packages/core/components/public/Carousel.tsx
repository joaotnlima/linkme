"use client";

import { useRef } from "react";

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

/** Horizontal snap-scroll row with prev/next arrows (shown on desktop hover). */
export function Carousel({ children }: { children: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="relative group">
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children.map((c, i) => <div key={i} className="snap-start shrink-0 w-[78%] md:w-[49%]">{c}</div>)}
      </div>
      <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className="hidden md:flex absolute left-0.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/95 border border-line text-ink items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer"><Chevron dir="left" /></button>
      <button type="button" aria-label="Next" onClick={() => scroll(1)} className="hidden md:flex absolute right-0.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/95 border border-line text-ink items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer"><Chevron dir="right" /></button>
    </div>
  );
}
