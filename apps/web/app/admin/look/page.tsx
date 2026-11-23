import { requireOwnerPage } from "@linkme/core/lib/auth";
import { getAdminData } from "@linkme/core/lib/queries";
import { LookAdmin } from "@linkme/core/components/admin/LookAdmin";

export default async function LookPage() {
  await requireOwnerPage();
  const data = await getAdminData();
  return (
    <>
      <h1 className="text-2xl font-bold">Look</h1>
      <LookAdmin settings={data.settings} feeds={data.feeds} links={data.links} posts={data.posts} hasInstagram={Boolean(process.env.INSTAGRAM_ACCESS_TOKEN)} />
    </>
  );
}
