import Link from "next/link";
import { getOwner } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await getOwner();
  // Login page renders without the shell; everything else requires the owner.
  if (!owner) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }
  return (
    <div className="flex-1 flex flex-wrap bg-bg text-ink" data-admin>
      <aside className="hidden md:flex flex-col gap-1.5 w-60 shrink-0 border-r border-line bg-card p-4">
        <div className="flex items-center gap-2.5 px-2.5 pb-4 text-sm font-semibold">
          <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs">⌂</span>
          Backoffice
        </div>
        <AdminNav variant="sidebar" />
        <div className="flex-1" />
        <Link href="/" target="_blank" className="h-11 px-3 rounded-xl border border-line flex items-center gap-2.5 text-sm font-medium">Open public page ↗</Link>
        {owner.bypass ? (
          <p className="px-2 pt-3 text-xs text-muted">Local mode: no login. Fill .env.local with Supabase to enable GitHub sign-in.</p>
        ) : (
          <form action="/auth/signout" method="post"><button className="h-11 px-3 w-full text-left rounded-xl text-sm text-muted cursor-pointer">Sign out ({owner.name})</button></form>
        )}
      </aside>
      <main className="flex-[999_1_560px] min-w-0 flex flex-col pb-24 md:pb-10">
        <div className="w-full max-w-[760px] px-4 pt-5 md:px-10 md:pt-8 flex flex-col gap-4">{children}</div>
      </main>
      <nav aria-label="Admin sections" className="md:hidden fixed bottom-0 inset-x-0 h-20 border-t border-line bg-card grid grid-cols-4 px-2 pt-2 pb-5 z-20">
        <AdminNav variant="tabbar" />
      </nav>
    </div>
  );
}
