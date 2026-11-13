// Single place that decides "local mode" vs "Supabase mode".
export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ownerGithubId: process.env.OWNER_GITHUB_ID || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  instagramToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
  ingestToken: process.env.INGEST_TOKEN || "",
  devBypass: process.env.ADMIN_DEV_BYPASS === "true",
};

export const isLocalDb = !env.databaseUrl;
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
// With no Supabase configured and not in production, /admin opens without login.
export const authBypass =
  env.devBypass || (!hasSupabase && process.env.NODE_ENV !== "production");
