import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/core/lib/db/schema.ts",
  out: "./packages/core/drizzle",
  dialect: "postgresql",
  schemaFilter: ["links"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/unused",
  },
});
