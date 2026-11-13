import Link from "next/link";
import { requireOwnerPage } from "@/lib/auth";
import { getStats, type Range } from "@/lib/queries";
import { LinkIcon } from "@/components/public/Icon";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireOwnerPage();
  const { range: r } = await searchParams;
  const range: Range = r === "7d" || r === "90d" ? r : "30d";
  const s = await getStats(range);
  const max = Math.max(1, ...s.series.map((d) => d.n));
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
        <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Clicks</span><span className="text-3xl font-bold">{s.total.toLocaleString("en")}</span><span className={`text-xs font-semibold ${delta === null ? "text-muted" : delta >= 0 ? "text-accent" : "text-[#B45309]"}`}>{delta === null ? "no previous period" : `${delta >= 0 ? "+" : ""}${delta}% vs previous ${s.days}d`}</span></div>
        <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Links clicked</span><span className="text-3xl font-bold">{s.perLink.length}</span><span className="text-xs text-muted">distinct links in range</span></div>
      </div>
      <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Clicks per day · Europe/Lisbon</span>
        <div role="img" aria-label={`Clicks per day for the last ${s.days} days`} className="flex items-end gap-[2px] h-24">
          {s.series.map((d) => (
            <div key={d.day} title={`${d.day}: ${d.n}`} className={`flex-1 rounded-sm ${d.n === max && d.n > 0 ? "bg-accent" : "bg-accent-soft"}`} style={{ height: `${Math.max(3, (d.n / max) * 100)}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-muted"><span>{s.series[0]?.day}</span><span>{s.series[s.series.length - 1]?.day}</span></div>
      </div>
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex justify-between px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted"><span>Link</span><span>Clicks · share</span></div>
        {s.perLink.length === 0 ? <p className="px-4 pb-4 text-sm text-muted">No clicks in this range yet.</p> : null}
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
