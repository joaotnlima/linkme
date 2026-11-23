export async function register() {
  const { configureAuth } = await import("@linkme/core/lib/auth");
  const { githubOwnerProvider } = await import("@/lib/auth-provider");
  configureAuth(githubOwnerProvider);
}
