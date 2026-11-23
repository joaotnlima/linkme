import "server-only";
import { redirect } from "next/navigation";

export type Owner = { id: string; name: string; bypass: boolean };
export type AuthProvider = { getOwner(): Promise<Owner | null> };

let _provider: AuthProvider | null = null;

export function configureAuth(p: AuthProvider) {
  _provider = p;
}

export async function getOwner(): Promise<Owner | null> {
  return _provider ? _provider.getOwner() : null;
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
