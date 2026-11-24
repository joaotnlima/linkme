import {
  pgSchema,
  uuid,
  text,
  boolean,
  integer,
  bigserial,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Everything lives in its own Postgres schema so Supabase's PostgREST (which
// only exposes `public` by default) never sees these tables. The schema NAME is
// env-driven (`DB_SCHEMA`, default "links") so the same engine can run two
// products in one database on isolated schemas — e.g. the self-host on "links"
// and the SaaS platform on "yolink" — where evolving one never touches the other.
export const DB_SCHEMA = process.env.DB_SCHEMA || "links";
export const links = pgSchema(DB_SCHEMA);

// The tenant dimension. Single-tenant self-host runs with exactly one row
// (id = "default"); the SaaS platform adds one per signup. Every other table
// carries `tenantId` → tenant.id (on delete cascade) so a tenant's data is
// isolated and its removal is a single cascade.
export const tenant = links.table("tenant", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("free"), // free | pro
  status: text("status").notNull().default("active"), // active | past_due | canceled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenantMembers = links.table(
  "tenant_member",
  {
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("owner"), // owner (teams later)
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.userId] })],
);

export const settings = links.table("settings", {
  tenantId: text("tenant_id")
    .primaryKey()
    .references(() => tenant.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull().default("Your name"),
  bio: text("bio").default(""),
  tagline: text("tagline").default(""),
  quote: text("quote").default(""),
  avatarUrl: text("avatar_url"),
  siteTitle: text("site_title").default("Links"),
  siteDescription: text("site_description").default(""),
  themeDefault: text("theme_default").notNull().default("auto"), // auto | light | dark
  footer: text("footer").default(""),
  layout: text("layout").notNull().default("editorial"), // DESKTOP header: editorial | classic | hero | banner | callout
  layoutMobile: text("layout_mobile").notNull().default("classic"), // MOBILE header: classic | hero | banner | callout
  background: text("background").notNull().default("paths"), // animated scene key (components/public/backgrounds.tsx)
  // ---- customization (Look → Design) ----
  accentLight: text("accent_light").notNull().default("#0e7c66"),
  accentDark: text("accent_dark").notNull().default("#3ccba8"),
  buttonStyle: text("button_style").notNull().default("solid"), // solid | glass | outline
  buttonRadius: text("button_radius").notNull().default("rounded"), // sharp | rounded | pill
  buttonBg: text("button_bg"), // hex override for (non-featured) button background; null = theme card
  featuredBg: text("featured_bg"), // hex override for featured card background; null = accent-soft
  buttonBorder: text("button_border").notNull().default("thin"), // none | thin | thick
  buttonShadow: text("button_shadow").notNull().default("none"), // none | soft | hard
  buttonHover: text("button_hover").notNull().default("lift"), // none | grow | lift | color
  buttonHoverColor: text("button_hover_color"), // hex used when buttonHover = color; null = accent
  wallpaper: text("wallpaper").notNull().default("animated"), // animated | solid | gradient | image | video
  wallpaperColor: text("wallpaper_color"), // solid fill / gradient stop 1
  wallpaperColor2: text("wallpaper_color2"), // gradient stop 2
  wallpaperImageUrl: text("wallpaper_image_url"),
  wallpaperVideoUrl: text("wallpaper_video_url"),
  profileShape: text("profile_shape").notNull().default("circle"), // circle | rounded | squircle | burst
  bannerUrl: text("banner_url"),
  bannerVideoUrl: text("banner_video_url"), // looping muted video for the Banner header (overrides image)
  bannerHeight: text("banner_height").notNull().default("md"), // Banner header height: sm | md | lg | xl
  logoUrl: text("logo_url"),
  fontBody: text("font_body").notNull().default("default"),
  fontHeading: text("font_heading").notNull().default("default"),
  ctaLabel: text("cta_label").default(""),
  leadLinkId: uuid("lead_link_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feeds = links.table("feed", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // "Latest on LinkedIn"
  position: integer("position").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  source: text("source").notNull().default("manual"), // manual | instagram_graph
  style: text("style").notNull().default("cards"), // cards | grid
});

export const linksTable = links.table(
  "link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    url: text("url").notNull(),
    iconUrl: text("icon_url"),
    iconEmoji: text("icon_emoji"),
    section: text("section"),
    display: text("display").notNull().default("card"), // card | featured | icon
    enabled: boolean("enabled").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("link_position").on(t.position),
    uniqueIndex("link_tenant_slug").on(t.tenantId, t.slug),
  ],
);

export const posts = links.table(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    platform: text("platform").notNull().default("other"), // linkedin | instagram | other
    title: text("title"),
    excerpt: text("excerpt"),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    source: text("source").notNull().default("manual"), // manual | og | instagram_graph
    externalId: text("external_id"),
    enabled: boolean("enabled").notNull().default(true),
    autoplay: boolean("autoplay").notNull().default(false), // YouTube: autoplay muted on load
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("post_feed_position").on(t.feedId, t.position)],
);

export const clicks = links.table(
  "click",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    linkId: uuid("link_id")
      .notNull()
      .references(() => linksTable.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("click_link_ts").on(t.linkId, t.ts)],
);

export const feedsRelations = relations(feeds, ({ many }) => ({
  posts: many(posts),
}));
export const postsRelations = relations(posts, ({ one }) => ({
  feed: one(feeds, { fields: [posts.feedId], references: [feeds.id] }),
}));

export type Link = typeof linksTable.$inferSelect;
export type Feed = typeof feeds.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Tenant = typeof tenant.$inferSelect;
export type TenantMember = typeof tenantMembers.$inferSelect;
