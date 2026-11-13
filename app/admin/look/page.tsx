import { requireOwnerPage } from "@/lib/auth";
import { getAdminData } from "@/lib/queries";
import { LookAdmin } from "@/components/admin/LookAdmin";

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
