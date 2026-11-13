ALTER TABLE "links"."settings" ADD COLUMN "layout" text DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "cta_label" text DEFAULT '';