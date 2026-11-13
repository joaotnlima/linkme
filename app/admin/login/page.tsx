import { redirect } from "next/navigation";
import { getOwner } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { LoginButton } from "@/components/admin/LoginButton";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const owner = await getOwner();
  if (owner) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold">Backoffice</h1>
        {error ? <p className="text-sm text-[#B45309]">Not authorized: this GitHub account is not the owner.</p> : null}
        {hasSupabase ? (
          <LoginButton />
        ) : (
          <p className="text-sm text-muted">Supabase is not configured, and ADMIN_DEV_BYPASS is off. Fill .env.local or set ADMIN_DEV_BYPASS=true.</p>
        )}
      </div>
    </main>
  );
}
