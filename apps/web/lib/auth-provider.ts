import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabase, authBypass } from "@linkme/core/lib/env";
import type { Owner } from "@linkme/core/lib/auth";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there. The
          // proxy/callback route refreshes the session instead.
        }
      },
    },
  });
}

/** Returns the owner or null. Never throws. */
async function getOwner(): Promise<Owner | null> {
  if (authBypass) return { id: "dev", name: "Local owner", bypass: true };
  if (!hasSupabase) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const providerId =
    (user.user_metadata?.provider_id as string | undefined) ??
    user.identities?.find((i) => i.provider === "github")?.id;
  if (!env.ownerGithubId || String(providerId) !== String(env.ownerGithubId)) return null;
  return { id: user.id, name: (user.user_metadata?.user_name as string) || "owner", bypass: false };
}

export const githubOwnerProvider = { getOwner };
