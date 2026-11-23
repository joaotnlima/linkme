import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "@/lib/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "links-public";

/**
 * Stores a public file and returns its URL.
 * Local mode: public/uploads/<key>. Supabase mode: Storage bucket `links-public`.
 */
export async function putPublicFile(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  if (!hasSupabase || !env.supabaseSecretKey) {
    const file = path.join(process.cwd(), "public", "uploads", key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    return `/uploads/${key}`;
  }
  const admin = createClient(env.supabaseUrl, env.supabaseSecretKey, { auth: { persistSession: false } });
  // Idempotent bucket creation (ignore "already exists").
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);
  const { error } = await admin.storage.from(BUCKET).upload(key, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return admin.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}
