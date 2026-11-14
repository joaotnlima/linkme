import Link from "next/link";
import { requireOwnerPage } from "@/lib/auth";
import { getStats, type Range } from "@/lib/queries";
import { LinkIcon } from "@/components/public/Icon";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function fmtDay(day: string) {
  // Noon avoids a time-zone rollover when formatting a bare YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(day + "T12:00:00"));
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string; day?: string }> }) {
  await requireOwnerPage();
  const { range: r, day: d } = await searchParams;
  const range: Range = r === "7d" || r === "90d" ? r : "30d";
  const day = d && DAY_RE.test(d) ? d : null;
  const s = await getStats(range, day);
  const max = Math.max(1, ...s.series.map((x) => x.n));
  const delta = s.prev ? Math.round(((s.total - s.prev) / s.prev) * 100) : null;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div role="group" aria-label="Range" className="flex bg-card border border-line rounded-full p-[3px]">
          {(["7d", "30d", "90d"] as Range[]).map((x) => (
            <Link key={x} href={`/admin/stats?range=${x}`} aria-current={x === range ? "page" : undefined} className={`h-[34px] px-3 rounded-full text-[13px] flex items-center ${x === range ? "bg-ink text-bg font-semibold" : "text-muted font-medium"}`}>{x}</Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Clicks</span><span className="text-3xl font-bold">{s.total.toLocaleString("en")}</span><span className={`text-xs font-semibold ${day ? "text-muted" : delta === null ? "text-muted" : delta >= 0 ? "text-accent" : "text-[#B45309]"}`}>{day ? fmtDay(day) : delta === null ? "no previous period" : `${delta >= 0 ? "+" : ""}${delta}% vs previous ${s.days}d`}</span></div>
        <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Links clicked</span><span className="text-3xl font-bold">{s.perLink.length}</span><span className="text-xs text-muted">{day ? "distinct links that day" : "distinct links in range"}</span></div>
      </div>
      <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Clicks per day · Europe/Lisbon · tap a bar</span>
        <div role="group" aria-label={`Clicks per day for the last ${s.days} days`} className="flex items-end gap-[2px] h-24">
          {s.series.map((x) => {
            const active = x.day === day;
            return (
              <Link key={x.day} href={`/admin/stats?range=${range}&day=${x.day}`} scroll={false} aria-label={`${x.day}: ${x.n} clicks`} className="group relative flex-1 flex items-end h-full">
                <span className={`w-full rounded-sm transition-colors group-hover:bg-accent ${active ? "bg-ink" : x.n === max && x.n > 0 ? "bg-accent" : "bg-accent-soft"}`} style={{ height: `${Math.max(3, (x.n / max) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-bg opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{x.day.slice(5).replace("-", "/")} · {x.n}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] text-muted"><span>{s.series[0]?.day}</span><span>{s.series[s.series.length - 1]?.day}</span></div>
      </div>
      {day ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-ink">Viewing {fmtDay(day)}</span>
          <Link href={`/admin/stats?range=${range}`} className="text-[13px] font-semibold text-accent hover:underline">Clear · back to {range}</Link>
        </div>
      ) : null}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex justify-between px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted"><span>Link</span><span>Clicks · share</span></div>
        {s.perLink.length === 0 ? <p className="px-4 pb-4 text-sm text-muted">{day ? "No clicks on this day." : "No clicks in this range yet."}</p> : null}
        {s.perLink.map((l) => (
          <div key={l.linkId} className="flex items-center gap-3 px-4 py-2.5 border-t border-line">
            <LinkIcon title={l.title} iconUrl={l.iconUrl} iconEmoji={l.iconEmoji} size={32} />
            <span className="flex-1 min-w-0 text-[15px] font-medium truncate">{l.title}</span>
            <span className="text-sm font-semibold whitespace-nowrap">{l.n} <span className="text-muted font-medium">· {s.total ? Math.round((l.n / s.total) * 100) : 0}%</span></span>
          </div>
        ))}
      </div>
    </>
  );
}
