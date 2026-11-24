import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";
import { env, hasSupabase, hasR2 } from "@/lib/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "links-public";

/**
 * Stores a public file and returns its public URL. Backend, in priority order:
 *   1. Cloudflare R2  (hasR2)        → S3 PUT, served from env.r2PublicBaseUrl
 *   2. Supabase Storage (hasSupabase + secret key) → bucket `links-public`
 *   3. Local disk     (dev fallback) → public/uploads/<key>
 */
export async function putPublicFile(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  if (hasR2) return putToR2(key, bytes, contentType);

  if (hasSupabase && env.supabaseSecretKey) {
    const admin = createClient(env.supabaseUrl, env.supabaseSecretKey, { auth: { persistSession: false } });
    // Idempotent bucket creation (ignore "already exists").
    await admin.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);
    const { error } = await admin.storage.from(BUCKET).upload(key, bytes, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return admin.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }

  const file = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return `/uploads/${key}`;
}

/** Upload to Cloudflare R2 via its S3-compatible API (SigV4 signed with aws4fetch). */
async function putToR2(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const client = new AwsClient({
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
    service: "s3",
    region: "auto",
  });
  const endpoint = `https://${env.r2AccountId}.r2.cloudflarestorage.com/${env.r2Bucket}/${key}`;
  // Copy into a fresh Uint8Array so aws4fetch can hash a plain body (avoids
  // Buffer/pooled-ArrayBuffer edge cases) and R2 gets exact bytes.
  const body = bytes.slice();
  const res = await client.fetch(endpoint, {
    method: "PUT",
    body,
    // R2's S3 API rejects chunked uploads with 411 MissingContentLength. undici
    // streams a typed-array body without a length once aws4fetch re-wraps it, so
    // set Content-Length explicitly to force a sized, non-chunked PUT.
    headers: { "content-type": contentType, "content-length": String(body.byteLength) },
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return `${env.r2PublicBaseUrl}/${key}`;
}
