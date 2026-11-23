-- Slice 2: tenant data model.
-- Hand-edited from the drizzle-kit diff so it applies safely to an EXISTING,
-- populated single-tenant DB as well as to a fresh one. Order matters:
-- create tenant tables -> seed the default tenant -> add tenant_id as NULLABLE
-- -> backfill 'default' -> enforce NOT NULL + FKs -> re-key settings -> swap the
-- global slug unique for the per-tenant composite.

-- 1. Tenant tables.
CREATE TABLE "links"."tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "links"."tenant_member" (
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	CONSTRAINT "tenant_member_tenant_id_user_id_pk" PRIMARY KEY("tenant_id","user_id")
);
--> statement-breakpoint

-- 2. The single existing tenant. Everything already in the DB belongs to it.
INSERT INTO "links"."tenant" (id, slug, plan, status) VALUES ('default','default','free','active') ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- 3. Add tenant_id as NULLABLE first so the ALTER succeeds on tables that
--    already hold rows (a NOT NULL add with no default would fail).
ALTER TABLE "links"."feed" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "links"."link" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "links"."post" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "links"."click" ADD COLUMN "tenant_id" text;--> statement-breakpoint

-- 4. Backfill existing rows to the default tenant.
UPDATE "links"."feed" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "links"."link" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "links"."post" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "links"."click" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 5. Now enforce NOT NULL and the FKs.
ALTER TABLE "links"."feed" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."link" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."post" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."click" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."tenant_member" ADD CONSTRAINT "tenant_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."feed" ADD CONSTRAINT "feed_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."link" ADD CONSTRAINT "link_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."post" ADD CONSTRAINT "post_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."click" ADD CONSTRAINT "click_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 6. settings becomes one row per tenant: add tenant_id, backfill, then swap the
--    primary key off the old integer id and drop that column.
ALTER TABLE "links"."settings" ADD COLUMN "tenant_id" text;--> statement-breakpoint
UPDATE "links"."settings" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" DROP CONSTRAINT IF EXISTS "settings_pkey";--> statement-breakpoint
ALTER TABLE "links"."settings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "links"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("tenant_id");--> statement-breakpoint
ALTER TABLE "links"."settings" ADD CONSTRAINT "settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "links"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 7. Uniqueness is now per-tenant: drop the global slug unique, add the composite.
ALTER TABLE "links"."link" DROP CONSTRAINT IF EXISTS "link_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "link_tenant_slug" ON "links"."link" USING btree ("tenant_id","slug");
