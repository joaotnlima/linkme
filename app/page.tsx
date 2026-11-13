import type { Metadata } from "next";
import { getPublicPage } from "@/lib/queries";
import { PublicPage } from "@/components/public/PublicPage";
import { PublicPageEditorial } from "@/components/public/PublicPageEditorial";
import { siteQrSvg, siteUrl } from "@/lib/share";

// ISR: cached, regenerated at most every 60 s, purged on every admin write.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicPage();
  return {
    title: settings.siteTitle || settings.displayName,
    description: settings.siteDescription || settings.bio || undefined,
    openGraph: {
      title: settings.siteTitle || settings.displayName,
      description: settings.siteDescription || settings.bio || undefined,
      images: settings.avatarUrl ? [settings.avatarUrl] : undefined,
    },
  };
}

export default async function Page() {
  const [data, qrSvg] = await Promise.all([getPublicPage(), siteQrSvg()]);
  const props = { ...data, qrSvg, siteUrl };
  if (data.settings.layout === "editorial") return <PublicPageEditorial {...props} />;
  return <PublicPage {...props} />;
}
