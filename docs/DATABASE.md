# Database & Migrations

This project has **no historical migration tooling** — every table currently in production was created by hand, directly against the live database, with no record of it in this repo. Prisma was introduced specifically to fix that going forward, without rewriting anything that already works.

## Two separate concerns: schema/migrations vs. queries

- **Prisma** (`prisma/schema.prisma`, `prisma/migrations/`) manages the database *schema* — creating/changing tables, and tracking that history as reviewable files.
- **Raw `pg.Pool`** (`database.js`, used throughout `controllers/` and `server.js`) is still how the app actually *queries* the database at runtime.

These two are deliberately decoupled. Prisma Client (`@prisma/client`, generated into `generated/prisma`) exists and is installed, but nothing in the app currently uses it to run queries — introducing it as a query layer would touch every controller (some are 1,000+ lines) with no test suite to catch regressions, so that's an explicit non-goal for now. If/when the team wants to migrate query code to Prisma Client, do it controller-by-controller, not all at once, and ideally once there's some test coverage to lean on.

## Environments and where connection strings live

| Environment | Config location | Points at |
|---|---|---|
| App (dev) | `.env.development` → `DATABASE_HOSTNAME`/`PORT`/`USER`/`KEY`/`NAME` | Local Docker replica (`localhost:5433`) |
| App (prod) | `.env.production` (same var names) | The real production database |
| Prisma (local) | `prisma/.env.local` → `DATABASE_URL` | Local Docker replica (`localhost:5433`) — same DB as above, different connection-string format |
| Prisma (prod deploy) | **Nowhere on disk, ever** | A one-off shell-exported `DATABASE_URL`, set by a maintainer, only for the duration of a single `migrate deploy` command |

The app's own env vars and Prisma's `DATABASE_URL` are separate on purpose — they don't share a file, so there's no risk of one config change accidentally affecting the other.

**Prisma tooling never holds production credentials.** This is a hard rule for this project, not just a preference — see the project's remediation plan for why. If you're about to put a production connection string into any file that gets committed or that Claude Code (or any other automated tool) can read, stop and use the shell-export pattern below instead.

## Local Postgres replica

Defined in `docker-compose.local.yml` at the repo root.

```bash
docker compose -f docker-compose.local.yml up -d      # start
docker compose -f docker-compose.local.yml down        # stop, keep data
docker compose -f docker-compose.local.yml down -v      # stop, WIPE data (fresh slate)
```

Connect directly:
```bash
docker exec -it lseed_postgres_local psql -U lseed_dev -d LSEEDServer
```

### Schema-only vs. full-data loads

Two very different things, don't mix them up:

- **Schema-only** (`pg_dump --schema-only ...`) — structure, zero rows. Safe to keep around indefinitely, safe for Prisma introspection, no privacy concerns. This is the default/recommended state for day-to-day development.
- **Full dump** (`pg_dump ...`, no `--schema-only`) — structure **and real production data**, including real SE/mentor personal information. Only load this when you specifically need to debug against realistic data. Treat the container the same way you'd treat production data while it's loaded: don't screen-share it carelessly, don't export it elsewhere, and wipe it back (`down -v`, then reload schema-only) once you're done.

Loading either:
```bash
docker cp <dump_file>.sql lseed_postgres_local:/tmp/dump.sql
docker exec lseed_postgres_local psql -U lseed_dev -d LSEEDServer -f /tmp/dump.sql
```
(Wipe first with `down -v` + `up -d` if the container already has a different load in it — reloading on top of existing data produces noisy "already exists" errors for the schema parts, though it's otherwise harmless.)

## Prisma workflow

### Day to day: `migrate dev`

```bash
# 1. Edit prisma/schema.prisma to describe the change
# 2. Generate + apply against your LOCAL replica:
npx prisma migrate dev --name describe_your_change
```
This creates a new timestamped folder under `prisma/migrations/` containing the actual SQL, and applies it to whatever `prisma7.config.ts` points at — which is always `prisma/.env.local` (the local replica), never production. Commit the new migration folder along with your `schema.prisma` change.

**Always read the generated `migration.sql` before committing.** The schema diff alone won't tell you if Prisma decided your change needs a `DROP COLUMN`, a type change with implicit casting, etc. Reviewers should read this file too.

### Checking status

```bash
npx prisma migrate status
```
Should report "Database schema is up to date!" with no drift. If it doesn't, figure out why before adding more migrations on top.

### Deploying to production — manual, by design

There is no CI/CD step that does this, and there shouldn't be one yet (this project has no automated tests and no staging environment — see the remediation plan for the full reasoning). A maintainer with real prod credentials runs this themselves, from their own machine:

```bash
DATABASE_URL="postgresql://<user>:<password>@<prod-host>:5432/LSEEDServer?schema=public" \
  npx prisma migrate deploy
```
This works because `prisma7.config.ts` loads `prisma/.env.local` via `dotenv`, which by default never overrides a variable that's already set — so a `DATABASE_URL` exported in your shell wins for that one command, then reverts to pointing at local dev again afterward. Nothing about this needs to be written to any file.

**One-time prerequisite before this can ever run against prod:** production has never had any Prisma command run against it, so it has no `_prisma_migrations` history table yet. The first time, a maintainer needs to run the baseline-adoption step against prod (the same `0_baseline` migration already in this repo, marked as already-applied) before any *new* migration can be deployed — otherwise `migrate deploy` will try to `CREATE TABLE` for things that already exist and fail:
```bash
DATABASE_URL="postgresql://<user>:<password>@<prod-host>:5432/LSEEDServer?schema=public" \
  npx prisma migrate resolve --applied 0_baseline
```
Do this once, ever, against prod. Every subsequent `migrate deploy` just works normally after that.

### Why the CLI version matters

`prisma`/`@prisma/client` are pinned to `7.10.0` in `package.json` — **don't run a bare `npm install -D prisma` and expect it to stay that way.** As of this writing, npm's `latest` tag for the `prisma` package points at an `8.0.0-rc.*` release candidate, not a stable release. If a future `npm update` pulls that in, check `npx prisma --version` and pin back to the current stable line if it's still a pre-release.
