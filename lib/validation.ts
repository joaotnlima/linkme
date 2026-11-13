import { z } from "zod";

/** http(s) URLs, plus mailto: and tel: (safe, non-script schemes). Bare hosts get https://. */
export const httpUrl = z
  .string()
  .trim()
  .transform((s) => (/^(https?:\/\/|mailto:|tel:)/i.test(s) ? s : `https://${s}`))
  .refine((s) => /^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9().\-\s]{3,})$/i.test(s), "Enter a valid URL, mailto: or tel:");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "letters, digits and single dashes")
  .max(64);

export const linkInput = z.object({
  url: httpUrl,
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  section: z.string().trim().max(60).optional().or(z.literal("")),
  display: z.enum(["card", "featured", "icon"]).default("card"),
  enabled: z.boolean().default(true),
  slug: slugSchema.optional().or(z.literal("")),
  iconEmoji: z.string().trim().max(8).optional().or(z.literal("")),
});
export type LinkInput = z.infer<typeof linkInput>;

export const settingsInput = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(160),
  tagline: z.string().trim().max(200),
  quote: z.string().trim().max(200),
  siteTitle: z.string().trim().max(80),
  siteDescription: z.string().trim().max(200),
  themeDefault: z.enum(["auto", "light", "dark"]),
  footer: z.string().trim().max(80),
  layout: z.enum(["editorial", "classic"]).default("editorial"),
  ctaLabel: z.string().trim().max(40),
  leadLinkId: z.string().uuid().optional().or(z.literal("")),
});

export const feedInput = z.object({
  title: z.string().trim().min(1).max(60),
  source: z.enum(["manual", "instagram_graph"]),
  style: z.enum(["cards", "grid"]),
  enabled: z.boolean().default(true),
});

export const postInput = z.object({
  feedId: z.string().uuid(),
  url: httpUrl,
  title: z.string().trim().max(200).optional().or(z.literal("")),
});
