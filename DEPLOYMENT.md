# Running and deploying Intelloger

- [Local development](#local-development)
- [First deployment, start to finish](#first-deployment-start-to-finish)
- [Day-to-day: shipping a change](#day-to-day-shipping-a-change)
- [Configuration reference](#configuration-reference)
- [Backups and recovery](#backups-and-recovery)
- [Things that will bite](#things-that-will-bite)

---

## Local development

```bash
npm install
npm run dev
```

No configuration needed. The database is a local libSQL file at
`data/dealforge.db`, uploads go to `.storage/`, and migrations apply on boot.

Seed the reference data once:

```bash
npm run db:seed-industries   # 14 industries and their question packs
npm run db:seed              # proof vault — WARNING: deletes all deals
```

Then sign up at `http://localhost:3000/auth/signup` and promote yourself:

```bash
npm run db:promote -- you@example.com admin
```

---

## First deployment, start to finish

Three accounts are needed: a database (Turso), a file bucket (Cloudflare R2 or
any S3-compatible provider), and a host (Vercel). Roughly 30 minutes.

### 1. Database — Turso

Turso is hosted libSQL, which is SQLite. The schema, the migrations and the
FTS5 candidate search all work unchanged.

```bash
# install the CLI and sign in
curl -sSfL https://tur.so/install.sh | bash
turso auth signup

# create the database and get its credentials
turso db create intelloger
turso db show intelloger --url        # -> libsql://intelloger-<org>.turso.io
turso db tokens create intelloger     # -> the auth token
```

Keep both values. Create a second database for previews if you want branch
deploys pointed somewhere safe:

```bash
turso db create intelloger-preview
```

### 2. File storage — Cloudflare R2

Uploaded resumes, source documents and proof files live here. **This cannot be
skipped**: a host's filesystem is discarded on every deploy, so files written to
disk are gone by the next one. The app refuses a production upload when no
bucket is configured rather than accepting a file it will lose.

In the Cloudflare dashboard: **R2 → Create bucket** (name it `intelloger`), then
**Manage R2 API Tokens → Create API token** with **Object Read & Write**.

You need four values:

| Value                       | Where it comes from                                    |
| --------------------------- | ------------------------------------------------------ |
| `STORAGE_BUCKET`            | the bucket name, e.g. `intelloger`                      |
| `STORAGE_ENDPOINT`          | `https://<account-id>.r2.cloudflarestorage.com`         |
| `STORAGE_ACCESS_KEY_ID`     | from the API token                                      |
| `STORAGE_SECRET_ACCESS_KEY` | from the API token, shown once                          |

Any S3-compatible provider works — AWS S3, Backblaze B2. For AWS S3, leave
`STORAGE_ENDPOINT` unset and set `STORAGE_REGION` to the bucket's region.

### 3. Host — Vercel

```bash
npm i -g vercel
vercel login
vercel link          # from the repository root
```

Or connect the GitHub repository in the Vercel dashboard, which also gives you
a preview deployment per pull request.

### 4. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**. Add them
to **Production**; add the preview database to **Preview** so branch deploys
never touch production data.

```
DATABASE_URL                 libsql://intelloger-<org>.turso.io
DATABASE_AUTH_TOKEN          <token from turso db tokens create>
STORAGE_BUCKET               intelloger
STORAGE_ENDPOINT             https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION               auto
STORAGE_ACCESS_KEY_ID        <r2 access key>
STORAGE_SECRET_ACCESS_KEY    <r2 secret key>
```

### 5. Create the schema

Migrations are **not** part of the build — see
[why](#why-migrations-are-not-in-the-build). Run them once against the new
database:

```bash
DATABASE_URL="libsql://intelloger-<org>.turso.io" \
DATABASE_AUTH_TOKEN="<token>" \
npm run db:migrate
```

Then seed the industry packs:

```bash
DATABASE_URL="..." DATABASE_AUTH_TOKEN="..." npm run db:seed-industries
```

Do **not** run `npm run db:seed` against production — it deletes all deals.

### 6. Deploy

```bash
vercel --prod
```

Or push to `main` if the repository is connected.

### 7. Create the first administrator

Everyone who signs up is a **viewer**, and nothing in the app can grant a role.
Without this step the first person in is locked out of their own instance.

1. Sign up through the deployed site at `/auth/signup`.
2. Promote that account:

```bash
DATABASE_URL="libsql://..." \
DATABASE_AUTH_TOKEN="<token>" \
npm run db:promote -- you@yourcompany.com admin
```

### 8. Add the repository secrets

So the migration workflow can run on future deploys, add to
**GitHub → Settings → Secrets and variables → Actions**, under an environment
named `production`:

- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

---

## Day-to-day: shipping a change

```bash
git checkout -b some-change
# ... work ...
npm run lint && npx tsc --noEmit && npm run build   # what CI will run
git push -u origin some-change
```

Open a pull request. CI typechecks, lints, applies migrations to a throwaway
database twice to prove they are idempotent, and builds. Vercel builds a preview
from the same commit.

Merging to `main` deploys. If the change touched `drizzle/`, the migration
workflow applies it to production first.

### Changing the schema

Two steps, and the second is the one people forget:

```bash
# 1. edit src/db/schema.ts, then generate the SQL
npm run db:generate

# 2. commit the generated file in drizzle/
git add drizzle/ src/db/schema.ts
```

The app applies files from `drizzle/`, not the schema. A schema change without
its generated migration does nothing in production.

Migrations are tracked by **content hash**. Editing one that has already run
changes its hash and it will be applied a second time — add a new file instead.

### Why migrations are not in the build

Putting `db:migrate` in the build command looks convenient and is a trap. Every
preview build runs that command too, so a branch deploy would migrate whichever
database it was pointed at, and two builds finishing together race to apply the
same file. They run from `.github/workflows/migrate-production.yml`, inside a
concurrency group, on pushes to `main` touching `drizzle/`, or on demand from
the Actions tab.

---

## Configuration reference

Every variable is in `.env.example`. The two that decide whether a deployment
works at all:

**`DATABASE_URL`** — `file:` for a local file, `libsql://` for Turso. With
`libsql://` you also need `DATABASE_AUTH_TOKEN`.

**`STORAGE_BUCKET`** — required in production. Unset means uploads go to the
container's disk, which does not survive a deploy. The app throws on a
production upload rather than accepting a file it is going to lose.

### Environment matrix

| Environment | Database                   | Storage               |
| ----------- | -------------------------- | --------------------- |
| Local       | `file:./data/dealforge.db` | `.storage/` on disk   |
| Preview     | its own Turso database     | its own bucket        |
| Production  | Turso                      | S3-compatible bucket  |

Preview deploys must not point at the production database. A preview is a branch
someone is still working on; a half-finished migration or a stray delete would
land on real data.

---

## Backups and recovery

Turso provides point-in-time restore — check the retention on your plan.

**That does not cover the bucket.** Uploaded resumes and proof documents exist
only there, and losing them is not recoverable from the database, which stores
only their keys. Enable object versioning or a lifecycle policy on the bucket
separately.

To take a local snapshot of the database:

```bash
turso db shell intelloger .dump > backup-$(date +%F).sql
```

---

## Things that will bite

- **`npm run db:seed` deletes all deals.** It seeds the proof vault and clears
  deals by design. It is not a production command.
- **A schema change needs a generated migration committed with it.** See above.
- **The candidate search depends on SQLite FTS5.** That is why this runs on
  libSQL rather than Postgres. Moving to Postgres later means rewriting that
  search against `tsvector`, and reviewing all migrations for dialect
  differences.
- **New accounts are viewers.** Use `npm run db:promote` until there is an admin
  UI for roles.
- **Authorization is incomplete.** The authentication bypass is closed and
  `src/lib/authz.ts` defines the role, capability and domain model, but the
  server actions do not yet enforce it — any signed-in user can still edit any
  deal. Close that before this holds real client data.
