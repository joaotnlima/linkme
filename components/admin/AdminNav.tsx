"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Links", icon: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></> },
  { href: "/admin/look", label: "Look", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
  { href: "/admin/stats", label: "Stats", icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  { href: "/admin/settings", label: "Settings", icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></> },
];

export function AdminNav({ variant }: { variant: "sidebar" | "tabbar" }) {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        const cls =
          variant === "sidebar"
            ? `h-11 px-3 rounded-xl flex items-center gap-2.5 text-[15px] ${on ? "bg-accent-soft text-accent font-semibold" : "text-muted font-medium"}`
            : `flex flex-col items-center gap-1 text-[11px] ${on ? "text-accent font-semibold" : "text-muted font-medium"}`;
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={cls}>
            <svg aria-hidden="true" width={variant === "sidebar" ? 20 : 22} height={variant === "sidebar" ? 20 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{it.icon}</svg>
            {it.label}
          </Link>
        );
      })}
    </>
  );
}
