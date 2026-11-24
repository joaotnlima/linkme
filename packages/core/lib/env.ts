// Single place that decides "local mode" vs "Supabase mode".
export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  // New key names (sb_publishable_… / sb_secret_…); the legacy anon / service_role names still work as fallbacks.
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ownerGithubId: process.env.OWNER_GITHUB_ID || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  instagramToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
  ingestToken: process.env.INGEST_TOKEN || "",
  devBypass: process.env.ADMIN_DEV_BYPASS === "true",
  // Cloudflare R2 (S3-compatible) public object storage. When all are set, R2 is
  // the preferred backend for uploaded files (avatars, banners, post images, link
  // icons) over Supabase Storage. `r2PublicBaseUrl` is the public URL the bucket
  // is served from (an r2.dev URL or a custom domain like https://cdn.yolin.me).
  r2AccountId: process.env.R2_ACCOUNT_ID || "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  r2Bucket: process.env.R2_BUCKET || "",
  r2PublicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, ""),
};

export const isLocalDb = !env.databaseUrl;
export const hasSupabase = Boolean(env.supabaseUrl && env.supabasePublishableKey);
export const hasR2 = Boolean(
  env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket && env.r2PublicBaseUrl,
);
// With no Supabase configured and not in production, /admin opens without login.
export const authBypass =
  env.devBypass || (!hasSupabase && process.env.NODE_ENV !== "production");

// NOTE: core reads env but asserts NO auth model. The self-host's fail-closed
// production checks (OWNER_GITHUB_ID required, Supabase required, no dev-bypass)
// are self-host policy and live in apps/web/instrumentation.ts — so a consumer
// with a different auth model (e.g. the multi-tenant platform) is not forced
// into the single-owner/Supabase assumptions.
