// Seeds a starter profile, two tabs and a few links when the store is empty. Idempotent.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { sql } from "drizzle-orm";

async function main() {
  const { getDb, schema } = await import("../packages/core/lib/db");
  const { DEFAULT_TENANT_ID } = await import("../packages/core/lib/tenant");
  const db = await getDb();
  const { tenant, settings, feeds, linksTable, posts } = schema;
  const tenantId = DEFAULT_TENANT_ID;
  // The default tenant must exist before anything references it (the migration
  // also inserts it, but seeding a fresh store can run before that is relied on).
  await db
    .insert(tenant)
    .values({ id: tenantId, slug: tenantId, plan: "free", status: "active" })
    .onConflictDoNothing();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(linksTable);
  if (Number(n) > 0) {
    console.log("Store already has links; seed skipped.");
    return;
  }
  await db
    .insert(settings)
    .values({
      tenantId,
      displayName: "Your Name",
      bio: "What you do · Where you are",
      tagline: "One sentence that says what you care about.",
      quote: "An optional smaller line underneath.",
      siteTitle: "Your Name — links",
      siteDescription: "Links, writing and latest posts.",
      footer: "",
    })
    .onConflictDoNothing();
  const [li] = await db.insert(feeds).values({ tenantId, title: "Latest on LinkedIn", position: 0, source: "manual", style: "cards" }).returning();
  await db.insert(feeds).values({ tenantId, title: "Latest on Instagram", position: 1, source: "manual", style: "grid", enabled: false });
  const inserted = await db
    .insert(linksTable)
    .values([
      { tenantId, slug: "linkedin", title: "LinkedIn", subtitle: "Where I write", url: "https://www.linkedin.com/in/your-handle", position: 0 },
      { tenantId, slug: "project", title: "A project", subtitle: "One line about it", url: "https://example.com", section: "Now", position: 1 },
      { tenantId, slug: "talk", title: "A talk or article", subtitle: "Where it was published", url: "https://example.com/talk", section: "Writing & talks", position: 2 },
      { tenantId, slug: "github", title: "GitHub", url: "https://github.com/your-handle", display: "icon", position: 3 },
      { tenantId, slug: "email", title: "Email", url: "mailto:you@example.com", display: "icon", position: 4 },
    ])
    .returning({ id: linksTable.id, slug: linksTable.slug });
  const lead = inserted.find((l) => l.slug === "linkedin")!;
  await db.update(settings).set({ leadLinkId: lead.id, ctaLabel: "Let’s talk on LinkedIn", layout: "editorial" }).where(sql`${settings.tenantId} = ${tenantId}`);
  await db.insert(posts).values([
    { tenantId, feedId: li.id, url: "https://www.linkedin.com/posts/example-1", platform: "linkedin", title: "Example post — replace me in /admin/look", publishedAt: new Date(Date.now() - 7 * 86400000), position: 0 },
  ]);
  console.log("Seeded a starter profile, 2 feeds, 5 links and 1 post. Edit everything in /admin.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
