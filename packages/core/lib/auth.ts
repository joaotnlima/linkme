import "server-only";
import { redirect } from "next/navigation";

export type Owner = { id: string; name: string; bypass: boolean };
export type AuthProvider = { getOwner(): Promise<Owner | null> };

// The provider is registered once at server startup (apps/web/instrumentation.ts)
// and read per request by getOwner(). It is stored on globalThis — NOT a module-
// level `let` — because the bundler may instantiate this module more than once
// (e.g. the instrumentation bundle vs the page/action bundles), and a module-local
// variable set in one instance is invisible to the others. globalThis is shared
// across them within the same server process, so the registration always sticks.
const slot = globalThis as unknown as { __linkmeAuthProvider?: AuthProvider | null };

export function configureAuth(p: AuthProvider) {
  slot.__linkmeAuthProvider = p;
}

export async function getOwner(): Promise<Owner | null> {
  const provider = slot.__linkmeAuthProvider;
  return provider ? provider.getOwner() : null;
}

export async function requireOwner(): Promise<Owner> {
  const o = await getOwner();
  if (!o) throw new Error("Not authorized");
  return o;
}

export async function requireOwnerPage(): Promise<Owner> {
  const o = await getOwner();
  if (!o) redirect("/admin/login?error=unauthorized");
  return o;
}
