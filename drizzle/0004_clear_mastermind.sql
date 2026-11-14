ALTER TABLE "links"."settings" ADD COLUMN "accent_light" text DEFAULT '#0e7c66' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "accent_dark" text DEFAULT '#3ccba8' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "button_style" text DEFAULT 'solid' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "button_radius" text DEFAULT 'rounded' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "wallpaper" text DEFAULT 'animated' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "wallpaper_color" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "wallpaper_color2" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "wallpaper_image_url" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "wallpaper_video_url" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "profile_shape" text DEFAULT 'circle' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "font_body" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "links"."settings" ADD COLUMN "font_heading" text DEFAULT 'default' NOT NULL;