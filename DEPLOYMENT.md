# Running and deploying Intelloger

## Local development

```bash
npm install
npm run dev
```

No configuration is needed. The database is a local libSQL file at
`data/dealforge.db`, uploads go to `.storage/`, and migrations apply on boot.

Seed the reference data once:

```bash
npm run db:seed-industries   # industries and their packs
npm run db:seed              # proof vault — note this deletes all deals
```

`db:seed` clears the deals table by design. Do not run it against anything you
care about.

## Environments

| Environment | Database                  | Storage            |
| ----------- | ------------------------- | ------------------ |
| Local       | `file:./data/dealforge.db` | `.storage/` on disk |
| Preview     | Its own Turso database     | Its own bucket     |
| Production  | Turso                      | S3-compatible bucket |

Preview deploys must not point at the production database. A preview is a
branch someone is still working on; pointing it at production data means a
half-finished migration or a stray delete lands on the real thing.

## Configuration

Every variable, and what happens if it is missing, is in `.env.example`.
The two that matter:

- **`DATABASE_URL`** — `file:` for a local file, `libsql://` for Turso.
  With `libsql://` you also need `DATABASE_AUTH_TOKEN`.
- **`STORAGE_BUCKET`** — an S3-compatible bucket. **Required in production.**
  Without it, uploads write to the container's filesystem, which is discarded on
  the next deploy. The app throws on a production upload rather than accepting a
  file it is going to lose.

## Deploying

The app is a standard Next.js project and needs no special build configuration.

1. Connect the repository to the platform.
2. Set the environment variables above, per environment.
3. Push. CI typechecks, lints, applies migrations to a throwaway database twice
   to prove they are idempotent, and builds. The platform builds the same commit.

### Migrations

Migrations are **not** part of the build. They run from
`.github/workflows/migrate-production.yml`, on pushes to `main` that touch
`drizzle/`, or on demand.

This is deliberate. Putting them in the build command means every preview build
migrates whatever database it is pointed at, and two builds finishing together
race to apply the same file. The workflow uses a concurrency group so two runs
can never overlap.

To apply by hand:

```bash
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npm run db:migrate
```

Migrations are tracked by content hash, so re-running applies nothing. Editing
a migration that has already run changes its hash and it will be applied again
— add a new file instead.

## Backups

Turso handles point-in-time restore; check the retention on your plan. The
object storage bucket is not covered by that and needs its own versioning or
lifecycle policy. Uploaded resumes and proof documents only exist there.

## Things that will bite

- **`db:seed` deletes all deals.** It seeds the proof vault and clears deals by
  design. It is not a production command.
- **A schema change needs two steps**: `npm run db:generate` to produce the SQL
  from `src/db/schema.ts`, then commit the generated file in `drizzle/`. The app
  applies files from that directory, not the schema.
- **The candidate search depends on SQLite FTS5.** It is why this runs on libSQL
  rather than Postgres. Moving to Postgres later means rewriting that search.
- **First account is a viewer.** Roles are not self-service; someone has to be
  promoted to admin directly in the database until an admin UI exists.
