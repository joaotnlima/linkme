import { z } from "zod";
import { BACKGROUND_KEYS } from "@/components/public/backgrounds";
const fontName = z.string().trim().max(50).regex(/^[A-Za-z0-9 ]*$/, "Letters, numbers and spaces only").default("");
const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #0e7c66");
const optUrl = z.string().trim().max(600).optional().or(z.literal(""));

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
  layout: z.enum(["editorial", "classic", "hero", "banner", "callout"]).default("editorial"),
  background: z.enum(BACKGROUND_KEYS).default("paths"),
  accentLight: hexColor.default("#0e7c66"),
  accentDark: hexColor.default("#3ccba8"),
  buttonStyle: z.enum(["solid", "glass", "outline"]).default("solid"),
  buttonRadius: z.enum(["sharp", "rounded", "pill"]).default("rounded"),
  wallpaper: z.enum(["animated", "solid", "gradient", "image", "video"]).default("animated"),
  wallpaperColor: optUrl,
  wallpaperColor2: optUrl,
  wallpaperImageUrl: optUrl,
  wallpaperVideoUrl: optUrl,
  profileShape: z.enum(["circle", "rounded", "squircle", "burst"]).default("circle"),
  bannerUrl: optUrl,
  logoUrl: optUrl,
  fontBody: fontName,
  fontHeading: fontName,
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
