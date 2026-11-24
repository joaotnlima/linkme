export async function register() {
  // Fail closed in production (self-host policy — not in the shared core env, so
  // the platform with its own auth isn't forced into these). An open admin or a
  // missing owner id must never ship.
  if (process.env.NODE_ENV === "production") {
    const { env, hasSupabase } = await import("@linkme/core/lib/env");
    if (env.devBypass) throw new Error("ADMIN_DEV_BYPASS must not be set in production");
    if (hasSupabase && !env.ownerGithubId) throw new Error("OWNER_GITHUB_ID is required in production");
    if (!hasSupabase) throw new Error("Supabase env vars are required in production (local mode is dev-only)");
  }
  const { configureAuth } = await import("@linkme/core/lib/auth");
  // Register a thin provider whose getOwner lazily pulls in the Supabase/
  // next-headers implementation only when called (per request) — so startup
  // never imports request-scoped modules, and registration can't fail there.
  configureAuth({
    getOwner: async () => (await import("@/lib/auth-provider")).githubOwnerProvider.getOwner(),
  });
}
