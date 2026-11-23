ALTER TABLE "links"."tab" RENAME TO "feed";--> statement-breakpoint
ALTER TABLE "links"."feed" RENAME COLUMN "name" TO "title";--> statement-breakpoint
ALTER TABLE "links"."feed" RENAME COLUMN "feed_source" TO "source";--> statement-breakpoint
ALTER TABLE "links"."feed" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "links"."feed" DROP COLUMN "lead_link_id";--> statement-breakpoint
ALTER TABLE "links"."feed" DROP COLUMN "feed_title";--> statement-breakpoint
ALTER TABLE "links"."feed" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."feed" ADD COLUMN "style" text DEFAULT 'cards' NOT NULL;--> statement-breakpoint
UPDATE "links"."feed" SET "source" = 'manual' WHERE "source" = 'none';--> statement-breakpoint
ALTER TABLE "links"."link" DROP CONSTRAINT "link_tab_id_tab_id_fk";--> statement-breakpoint
DROP INDEX "links"."link_tab_position";--> statement-breakpoint
ALTER TABLE "links"."link" DROP COLUMN "tab_id";--> statement-breakpoint
CREATE INDEX "link_position" ON "links"."link" USING btree ("position");--> statement-breakpoint
ALTER TABLE "links"."post" DROP CONSTRAINT "post_tab_id_tab_id_fk";--> statement-breakpoint
DROP INDEX "links"."post_tab_position";--> statement-breakpoint
ALTER TABLE "links"."post" RENAME COLUMN "tab_id" TO "feed_id";--> statement-breakpoint
ALTER TABLE "links"."post" ADD CONSTRAINT "post_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "links"."feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_feed_position" ON "links"."post" USING btree ("feed_id","position");--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "lead_link_id" uuid;--> statement-breakpoint
ALTER TABLE "links"."settings" ALTER COLUMN "layout" SET DEFAULT 'editorial';--> statement-breakpoint
UPDATE "links"."settings" SET "layout" = 'editorial';
