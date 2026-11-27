import * as schema from "./schema";
import { env, isLocalDb } from "@/lib/env";
import type { PgDatabase } from "drizzle-orm/pg-core";

type Db = PgDatabase<any, typeof schema>; // eslint-disable-line @typescript-eslint/no-explicit-any
// Builds a drizzle instance over the one shared connection for a given schema. The
// platform repo calls this with ITS OWN schema (billing tables) so those stay out
// of the open-source engine while sharing this pool (ADR 0009).
type Make = <S extends Record<string, unknown>>(s: S) => PgDatabase<any, S>; // eslint-disable-line @typescript-eslint/no-explicit-any

const globalForDb = globalThis as unknown as { __dbFactory?: Promise<Make>; __coreDb?: Db };

async function createFactory(): Promise<Make> {
  if (isLocalDb) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await (await import("node:fs/promises")).mkdir(".data/pglite", { recursive: true });
    const client = new PGlite(".data/pglite");
    const make = (<S extends Record<string, unknown>>(s: S) => drizzle(client, { schema: s })) as Make;
    // Find the migrations folder by walking up from the CWD — robust to where
    // `next dev` is launched (app dir, repo root, …). Prefers the engine's own
    // `packages/core/drizzle`; falls back to a local `./drizzle` (the platform's,
    // when this engine is consumed as a submodule). Fixes "Can't find
    // meta/_journal.json" in standalone local dev.
    const { existsSync } = await import("node:fs");
    const nodePath = await import("node:path");
    const hasJournal = (d: string) => existsSync(nodePath.join(d, "meta", "_journal.json"));
    let migrationsFolder = "./drizzle";
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      const coreDir = nodePath.join(dir, "packages", "core", "drizzle");
      const hereDir = nodePath.join(dir, "drizzle");
      if (hasJournal(coreDir)) { migrationsFolder = coreDir; break; }
      if (hasJournal(hereDir)) { migrationsFolder = hereDir; break; }
      const up = nodePath.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    await migrate(make(schema), { migrationsFolder });
    return make;
  }
  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  // Supabase pooler (Supavisor) in transaction mode: no prepared statements.
  // On serverless (Fluid Compute) the pool is cached across invocations, so
  // recycle idle/old connections — the pooler drops idle server conns and a
  // reused dead socket otherwise hangs the request. Fail fast on connect too.
  const client = postgres(env.databaseUrl, {
    prepare: false,
    // `max` MUST be >1: a single render issues several queries concurrently (e.g.
    // getAdminData's Promise.all of 5, plus the layout + tenant-resolver queries).
    // With max:1 those get pipelined onto ONE connection, which Supavisor's
    // transaction pooler cannot service — they never reach Postgres (so
    // statement_timeout never fires) and the request hangs until the function
    // times out. A small pool gives each concurrent query its own pooled connection.
    max: 10,
    idle_timeout: 20, // close a connection after 20s idle
    max_lifetime: 60 * 5, // recycle connections every 5 min
    connect_timeout: 10, // error instead of hanging if connect stalls
    // Server-side cap: Postgres cancels any query running >8s. Bounds a stalled
    // request to a fast error instead of a 300s function timeout.
    connection: { statement_timeout: 8000 },
  });
  return (<S extends Record<string, unknown>>(s: S) => drizzle(client, { schema: s })) as Make;
}

function factory(): Promise<Make> {
  if (!globalForDb.__dbFactory) globalForDb.__dbFactory = createFactory();
  return globalForDb.__dbFactory;
}

/** The engine's own drizzle instance (core schema). */
export async function getDb(): Promise<Db> {
  if (globalForDb.__coreDb) return globalForDb.__coreDb;
  globalForDb.__coreDb = (await factory())(schema) as unknown as Db;
  return globalForDb.__coreDb;
}

/** A drizzle instance over the SAME connection but a caller-supplied schema —
 *  used by the platform for its billing/commerce tables. */
export async function getDbWithSchema<S extends Record<string, unknown>>(s: S): Promise<PgDatabase<any, S>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (await factory())(s);
}

export { schema };
