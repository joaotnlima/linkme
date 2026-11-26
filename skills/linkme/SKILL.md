---
name: linkme
description: >-
  Build features on and around linkme — the open-source link-in-bio engine.
  Use this when an agent needs to understand what the project does, its data
  model, and the operations it exposes, so it can extend the page, add links,
  feeds and posts, or wire new functionality on a self-hosted instance.
license: see repository LICENSE
---

# linkme — engine operations

**linkme** is the open-source engine behind a link-in-bio page: a public
profile at `/<handle>` that renders a header, a list of **links** (optionally
grouped into **sections**), **feeds** (semi-automatic social post pulls) and
**posts**, plus first-party **click analytics**. It is multi-tenant: every row
is scoped by `tenant_id`, and every query/mutation is filtered on it — never
fetch-then-filter.

This skill describes the engine as code (`packages/core`). If you are driving a
*managed* yolin.me instance over HTTP instead of editing code, use the REST API
skill served at `https://api.yolin.me/v1/skills` — same concepts, different
surface.

## Where things live (`packages/core/lib`)

| File | What it owns |
|------|--------------|
| `db/schema.ts` | Drizzle tables: `tenant`, `settings`, `linksTable`, `feeds`, `posts`, `clicks`, `tenantMembers`. All in the `links` pg schema. |
| `db/index.ts` | `getDb()` (shared postgres.js pool), `getDbWithSchema(s)` (run your own schema over the same pool). |
| `queries.ts` | Read model: `getPublicPage`, `getAdminData`, `getSettings`, `getStats`, `resolveSlug`, `recordClick`. |
| `actions.ts` | Write model: the server actions listed below. Each calls `requireOwner()` and re-scopes to the caller's tenant. |
| `validation.ts` | Zod input schemas: `linkInput`, `settingsInput`, `feedInput`, `postInput`. Reuse these — do not hand-roll validation. |
| `tenant.ts` | `currentTenantId()`, `tenantTag(id)` (cache tag), and the pluggable **seams** (`configureTenantResolver`, `configureAuth`, `configureOnPublish`). |

## Data model (the nouns)

- **tenant** — one page/owner. `id`, `slug` (the public handle), `createdAt`.
- **settings** — the profile/look: display name, bio, avatar, banner, layout,
  theme, footer, etc. One row per tenant.
- **link** — a titled URL. Has `position` (display order), optional `section`
  label, `display` style, `enabled`, a per-tenant-unique `slug`, and an icon
  (auto-fetched favicon or emoji).
- **feed** — a semi-automatic pull of recent posts from a source (e.g. a social
  account). Has `source`, `style`, `enabled`, `position`.
- **post** — an item shown in a feed (added by URL or synced).
- **click** — one recorded click/view event, used for analytics.

## Operations (the verbs)

All are server actions in `actions.ts`; they authorize via the `configureAuth`
seam, mutate only the caller's tenant, then invalidate that tenant's cache
(`revalidateTag(tenantTag(id))`) and fire the `onPublish` seam.

**Links** — `createLink`, `updateLink`, `setLinkEnabled(id, on)`,
`deleteLink(id)`, `moveLink(id, 'up'|'down')`.
**Profile / look** — `updateSettings`, `setAvatar`, `setBanner`.
**Feeds** — `upsertFeed`, `moveFeed(id, dir)`, `deleteFeed(id)`,
`syncInstagram(feedId)`.
**Posts** — `addPostByUrl`, `updatePost`, `refetchPost(id)`, `deletePost(id)`.
**Reads** — `getPublicPage(tenantId)` (everything the public page needs,
cached), `getAdminData(tenantId)` (dashboard view incl. click counts),
`getStats(tenantId, range, day?)` (time-series analytics).

## How to extend it (recipes)

- **Add a new field to the page** → add the column in `db/schema.ts`, add it to
  `settingsInput` in `validation.ts`, write it in `updateSettings`, render it in
  the public component. Generate a migration with Drizzle; never edit the DB by
  hand.
- **Add a new kind of block** → model it like `links` (a `tenant_id`-scoped
  table with `position`/`enabled`), give it zod input + CRUD actions mirroring
  the link actions, and add it to `getPublicPage`'s parallel read.
- **Integrate with your own auth / multi-tenancy** → implement the three seams
  (`configureTenantResolver`, `configureAuth`, `configureOnPublish`) at
  app boot. The managed yolin.me does exactly this in `instrumentation-node.ts`.
- **Invalidate correctly** → after any write, call
  `revalidateTag(tenantTag(tenantId))` so only that tenant's page recomputes.

## Rules

- Every query and mutation is scoped by `tenant_id`. A missing scope is a
  security bug (cross-tenant read/write).
- Reuse the zod schemas in `validation.ts`; return their messages on failure.
- Keep billing, API keys and operator concerns **out** of core — those belong to
  the hosting platform, not the open-source engine.
- Migrations are generated, reviewed, and committed — not applied ad hoc.
