import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  // Inline scripts: the theme bootstrap in <head>; dev needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co" + (isDev ? " ws: http://localhost:*" : ""),
  // Media embeds (YouTube / Spotify players in feeds).
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co https://github.com",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Previous caching model: ISR via `export const revalidate` + revalidatePath on writes.
  cacheComponents: false,
  // JS/CSS are already minified by SWC/Lightning CSS in production builds. This
  // enables gzip on the responses when self-hosting via `next start`; on Vercel
  // it is a no-op (the edge serves Brotli automatically). Explicit so "max
  // performance" is verifiable (Content-Encoding header) rather than implicit.
  compress: true,
  // Don't ship browser source maps to production — smaller public payload.
  productionBrowserSourceMaps: false,
  // Server Actions default to a 1 MB request body — too small for banner video uploads.
  experimental: { serverActions: { bodySizeLimit: "20mb" } },
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
