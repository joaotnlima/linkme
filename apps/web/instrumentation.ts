export async function register() {
  const { configureAuth } = await import("@linkme/core/lib/auth");
  // Register a thin provider whose getOwner lazily pulls in the Supabase/
  // next-headers implementation only when called (per request) — so startup
  // never imports request-scoped modules, and registration can't fail there.
  configureAuth({
    getOwner: async () => (await import("@/lib/auth-provider")).githubOwnerProvider.getOwner(),
  });
}
