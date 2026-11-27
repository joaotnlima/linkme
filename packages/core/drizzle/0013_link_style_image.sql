ALTER TABLE "links"."link" ADD COLUMN "style" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."link" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "links"."link" ADD COLUMN "image_mode" text DEFAULT 'icon' NOT NULL;