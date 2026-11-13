// `npm run db:migrate` — applies ./drizzle to DATABASE_URL (Supabase) or to the local PGlite store.
import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await (await import("node:fs/promises")).mkdir(".data/pglite", { recursive: true });
    const client = new PGlite(".data/pglite");
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    await client.close();
    console.log("Migrated local PGlite store at .data/pglite");
    return;
  }
  const postgres = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { prepare: false, max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("Migrated", url.replace(/:[^:@/]+@/, ":***@"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
