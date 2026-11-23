ALTER TABLE "links"."settings" ADD COLUMN "button_bg" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "button_border" text DEFAULT 'thin' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "button_shadow" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "button_hover" text DEFAULT 'lift' NOT NULL;