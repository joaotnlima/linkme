import { requireOwnerPage } from "@linkme/core/lib/auth";
import { env, hasSupabase, isLocalDb, authBypass } from "@linkme/core/lib/env";

export default async function SettingsPage() {
  const owner = await requireOwnerPage();
  const rows: [string, string][] = [
    ["Database", isLocalDb ? "Local PGlite (.data/pglite)" : "Postgres via DATABASE_URL"],
    ["Auth", authBypass ? "Open (local mode)" : hasSupabase ? `Supabase Auth · GitHub · owner id ${env.ownerGithubId || "(unset!)"}` : "Not configured"],
    ["Storage", hasSupabase && env.supabaseSecretKey ? "Supabase Storage · bucket links-public" : "public/uploads (local)"],
    ["Instagram sync", env.instagramToken ? "token set" : "no token"],
    ["Ingest endpoint", env.ingestToken ? "POST /api/ingest · token set" : "disabled (set INGEST_TOKEN)"],
    ["Site URL", env.siteUrl],
    ["Signed in as", owner.name],
  ];
  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-line bg-card divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-muted">{k}</span><span className="font-medium text-right">{v}</span></div>
        ))}
      </div>
      <p className="text-sm text-muted">Values come from <code>.env.local</code>. See <code>.env.example</code> for the Supabase switch-over.</p>
      {env.ingestToken ? (
        <div className="rounded-2xl border border-line bg-card p-4 flex flex-col gap-2 text-sm">
          <span className="font-semibold">Add posts from anywhere</span>
          <p className="text-muted">Drag this to your bookmarks bar; click it on any post page to add it to the matching feed.</p>
          <a href={`javascript:(function(){fetch('${env.siteUrl}/api/ingest?token=${env.ingestToken}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:location.href})}).then(r=>r.json()).then(j=>alert(j.ok?'Added to '+j.feedTitle+(j.preview==='blocked'?' (add a title in /admin)':''):'Failed: '+j.error)).catch(e=>alert('Failed: '+e));})();`} className="self-start h-10 px-3 rounded-xl bg-ink text-bg font-semibold flex items-center">+ Add to links</a>
          <p className="text-muted">Phone: an iOS Shortcut / Android HTTP Shortcut that POSTs the shared URL to <code>{env.siteUrl}/api/ingest?token=…</code> — steps in the README.</p>
        </div>
      ) : null}
    </>
  );
}
