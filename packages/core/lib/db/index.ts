import * as schema from "./schema";
import { env, isLocalDb } from "@/lib/env";
import type { PgDatabase } from "drizzle-orm/pg-core";

type Db = PgDatabase<any, typeof schema>; // eslint-disable-line @typescript-eslint/no-explicit-any

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

async function create(): Promise<Db> {
  if (isLocalDb) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await (await import("node:fs/promises")).mkdir(".data/pglite", { recursive: true });
    const client = new PGlite(".data/pglite");
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
    return db as unknown as Db;
  }
  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  // Supabase pooler (Supavisor) in transaction mode: no prepared statements.
  // On serverless (Fluid Compute) the pool is cached across invocations, so
  // recycle idle/old connections — the pooler drops idle server conns and a
  // reused dead socket otherwise hangs the request. Fail fast on connect too.
  const client = postgres(env.databaseUrl, {
    prepare: false,
    // Serverless + Supabase transaction pooler (pool_size 15). `max` is the number
    // of client connections this instance holds. It MUST be >1: a single render
    // issues several queries concurrently (e.g. getAdminData's Promise.all of 5,
    // plus the layout + tenant-resolver queries). With max:1 those concurrent
    // queries get pipelined onto ONE connection, which Supavisor's transaction
    // pooler cannot service — they never reach Postgres (so statement_timeout
    // never fires) and the request hangs until the function times out. A small
    // pool lets concurrent queries each take their own pooled connection; Fluid
    // reuses few instances and idle_timeout reaps them, so the pooler is safe.
    max: 10,
    idle_timeout: 20, // close a connection after 20s idle
    max_lifetime: 60 * 5, // recycle connections every 5 min
    connect_timeout: 10, // error instead of hanging if connect stalls
    // Server-side cap: Postgres cancels any query running >8s. Bounds a stalled
    // request to a fast error instead of a 300s function timeout that also
    // leaves pooler connections checked out.
    connection: { statement_timeout: 8000 },
  });
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__db) globalForDb.__db = create();
  return globalForDb.__db;
}

export { schema };
