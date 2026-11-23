import Link from "next/link";
import { requireOwnerPage } from "@linkme/core/lib/auth";
import { getAdminData } from "@linkme/core/lib/queries";
import { LinksAdmin } from "@linkme/core/components/admin/LinksAdmin";

export default async function AdminLinksPage() {
  await requireOwnerPage();
  const data = await getAdminData();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Links</h1>
        <Link href="/" target="_blank" className="md:hidden h-10 px-3.5 rounded-full border border-line bg-card text-sm font-medium flex items-center">Preview</Link>
      </div>
      <LinksAdmin links={data.links} clicks={Object.fromEntries(data.clicksByLink)} leadLinkId={data.settings.leadLinkId} />
    </>
  );
}
