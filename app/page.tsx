import type { Metadata } from "next";
import { getPublicPage } from "@/lib/queries";
import { PublicPage } from "@/components/public/PublicPage";
import { PublicPageEditorial } from "@/components/public/PublicPageEditorial";
import { siteQrSvg, siteUrl } from "@/lib/share";
import { currentTenantId } from "@/lib/tenant";

// Rendered on-demand at request time (no build-time DB access). The heavy work —
// the four DB queries and the QR — is served from the per-tenant Data Cache, so
// a normal visit recomputes nothing; the cache is refreshed only when the owner
// edits (revalidateTag in lib/actions.ts).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicPage(await currentTenantId());
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
  const [data, qrSvg] = await Promise.all([getPublicPage(await currentTenantId()), siteQrSvg()]);
  const props = { ...data, qrSvg, siteUrl };
  const desktop = data.settings.layout === "editorial"
    ? <PublicPageEditorial {...props} />
    : <PublicPage {...props} forceLayout={data.settings.layout} />;
  return (
    <>
      <div className="md:hidden flex-1 flex flex-col"><PublicPage {...props} forceLayout={data.settings.layoutMobile} /></div>
      <div className="hidden md:flex flex-1 flex-col">{desktop}</div>
    </>
  );
}
