CREATE SCHEMA "links";
--> statement-breakpoint
CREATE TABLE "links"."click" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"link_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links"."link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tab_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"url" text NOT NULL,
	"icon_url" text,
	"icon_emoji" text,
	"section" text,
	"display" text DEFAULT 'card' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "link_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "links"."post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tab_id" uuid NOT NULL,
	"url" text NOT NULL,
	"platform" text DEFAULT 'other' NOT NULL,
	"title" text,
	"excerpt" text,
	"image_url" text,
	"published_at" timestamp with time zone,
	"source" text DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links"."settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"display_name" text DEFAULT 'Your name' NOT NULL,
	"bio" text DEFAULT '',
	"tagline" text DEFAULT '',
	"quote" text DEFAULT '',
	"avatar_url" text,
	"site_title" text DEFAULT 'Links',
	"site_description" text DEFAULT '',
	"theme_default" text DEFAULT 'auto' NOT NULL,
	"footer" text DEFAULT '',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links"."tab" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"lead_link_id" uuid,
	"feed_source" text DEFAULT 'manual' NOT NULL,
	"feed_title" text DEFAULT ''
);
--> statement-breakpoint
ALTER TABLE "links"."click" ADD CONSTRAINT "click_link_id_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "links"."link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."link" ADD CONSTRAINT "link_tab_id_tab_id_fk" FOREIGN KEY ("tab_id") REFERENCES "links"."tab"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links"."post" ADD CONSTRAINT "post_tab_id_tab_id_fk" FOREIGN KEY ("tab_id") REFERENCES "links"."tab"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "click_link_ts" ON "links"."click" USING btree ("link_id","ts");--> statement-breakpoint
CREATE INDEX "link_tab_position" ON "links"."link" USING btree ("tab_id","position");--> statement-breakpoint
CREATE INDEX "post_tab_position" ON "links"."post" USING btree ("tab_id","position");