import "server-only";

// The app is still single-tenant: one settings row (id = 1) and globally unique
// slugs. This indirection lets the cache layer be written as if it were already
// multi-tenant — the public-page cache is keyed and invalidated per tenant, so
// turning `currentTenantId()` into a subdomain/path lookup later is the only
// change the caching needs.
export const DEFAULT_TENANT_ID = "default";

/** Cache tag covering everything that renders a tenant's public page. */
export function tenantTag(tenantId: string) {
  return `tenant:${tenantId}`;
}

// Resolution seam (mirrors the auth seam in lib/auth.ts): each app injects HOW
// the current tenant is determined. Stored on globalThis — not a module-level
// `let` — so bundle duplication (instrumentation vs page/action bundles) can't
// lose the registration.
type TenantResolver = () => Promise<string>;
const slot = globalThis as unknown as { __linkmeTenantResolver?: TenantResolver };

/** Register how the current tenant is resolved. The platform wires this in
 *  instrumentation; self-host never calls it → stays single-tenant. */
export function configureTenantResolver(fn: TenantResolver) {
  slot.__linkmeTenantResolver = fn;
}

/** The tenant for the current request. Unconfigured (self-host) → "default". */
export async function currentTenantId(): Promise<string> {
  return slot.__linkmeTenantResolver ? slot.__linkmeTenantResolver() : DEFAULT_TENANT_ID;
}
