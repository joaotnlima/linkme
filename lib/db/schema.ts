import {
  pgSchema,
  uuid,
  text,
  boolean,
  integer,
  bigserial,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Everything lives in its own schema so Supabase's PostgREST (which only
// exposes `public` by default) never sees these tables.
export const links = pgSchema("links");

export const settings = links.table("settings", {
  id: integer("id").primaryKey().default(1),
  displayName: text("display_name").notNull().default("Your name"),
  bio: text("bio").default(""),
  tagline: text("tagline").default(""),
  quote: text("quote").default(""),
  avatarUrl: text("avatar_url"),
  siteTitle: text("site_title").default("Links"),
  siteDescription: text("site_description").default(""),
  themeDefault: text("theme_default").notNull().default("auto"), // auto | light | dark
  footer: text("footer").default(""),
  layout: text("layout").notNull().default("editorial"), // editorial | classic
  ctaLabel: text("cta_label").default(""),
  leadLinkId: uuid("lead_link_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feeds = links.table("feed", {
  id: uuid("id").primaryKey().defaultRandom(),
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
    slug: text("slug").notNull().unique(),
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
  (t) => [index("link_position").on(t.position)],
);

export const posts = links.table(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("post_feed_position").on(t.feedId, t.position)],
);

export const clicks = links.table(
  "click",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
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
