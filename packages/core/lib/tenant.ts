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

/** Resolve the tenant for the current public request. Single-tenant for now. */
export async function currentTenantId(): Promise<string> {
  return DEFAULT_TENANT_ID;
}
