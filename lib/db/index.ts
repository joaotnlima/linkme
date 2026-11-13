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
    max: 5,
    idle_timeout: 20, // close a connection after 20s idle
    max_lifetime: 60 * 5, // recycle connections every 5 min
    connect_timeout: 10, // error instead of hanging if connect stalls
  });
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__db) globalForDb.__db = create();
  return globalForDb.__db;
}

export { schema };
