import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Previous caching model: ISR via `export const revalidate` + revalidatePath on writes.
  cacheComponents: false,
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
