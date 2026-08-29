# LSEED Insight — Development Guide

LSEED Insight is a role-based mentorship platform for DLSU's LSEED Center. This guide covers local setup, day-to-day development (frontend, backend, database), and the PR/deployment-readiness workflow.

> This document reflects the actual current state of the codebase, not the older Technical/User Manual, which predates several architecture changes (e.g. login is email+password+2FA, not Google OAuth; there is no Vercel serverless deployment — a single Express process serves the built frontend).

## Contents

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Running the app locally](#running-the-app-locally)
- [Making backend changes](#making-backend-changes)
- [Making frontend changes](#making-frontend-changes)
- [Making database schema changes (Prisma)](#making-database-schema-changes-prisma)
- [Testing before opening a PR](#testing-before-opening-a-pr)
- [Opening a PR](#opening-a-pr)
- [Deployment readiness checklist](#deployment-readiness-checklist)
- [Known caveats](#known-caveats)

---

## Prerequisites

- Node.js (no pinned version currently — match whatever's on the deployment target; recent LTS is safe)
- Docker Desktop (for the local Postgres replica)
- `git`

## First-time setup

1. **Clone and install dependencies**
   ```bash
   npm install            # root — backend deps
   cd client && npm install && cd ..   # frontend deps
   ```

2. **Environment files** — copy the templates and fill in real values:
   ```bash
   cp .env.example .env.development
   cp client/.env.example client/.env.development
   ```
   `.env.example` documents every variable and what it's for. **Never commit a filled-in `.env.development`/`.env.production`** — both are gitignored.

3. **Start the local Postgres replica** (Docker, PostgreSQL 16 — matches production's engine version):
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```
   This runs on `localhost:5433` (not 5432, to avoid clashing with any other local Postgres install), with credentials `lseed_dev` / `lseed_dev_local`, database `LSEEDServer`. These are already the defaults in `.env.example`'s database section.

4. **Load the schema.** You need a schema dump of production to load in — ask a maintainer with DB access for a current one, or generate it yourself if you have access:
   ```bash
   pg_dump --schema-only --no-owner --no-privileges -h <prod-host> -U <prod-user> -d <prod-db> > schema_snapshot.sql
   docker cp schema_snapshot.sql lseed_postgres_local:/tmp/schema_snapshot.sql
   docker exec lseed_postgres_local psql -U lseed_dev -d LSEEDServer -f /tmp/schema_snapshot.sql
   ```
   This gives you the real table structure with **zero rows** — safe to keep around long-term. See [docs/DATABASE.md](docs/DATABASE.md) for the full detail on schema-only vs. full-data loads, and why full-data loads need extra care.

5. **Generate the Prisma client** (used for schema/migration tooling, not for queries — the app still uses raw `pg` for that):
   ```bash
   npx prisma generate
   ```

## Running the app locally

Two terminals:

```bash
# Terminal 1 — backend (nodemon, port 4000)
npm run dev

# Terminal 2 — frontend (Vite, port 3000, proxies /api, /auth, /login etc. to :4000)
cd client && npm run dev
```

Open `http://localhost:3000`. With an empty (schema-only) local database there's nothing to log in with yet — either load a full data dump (see [docs/DATABASE.md](docs/DATABASE.md)) or insert a minimal test user/role manually.

## Making backend changes

- **Where things live:** most route handlers currently live directly in `server.js` (a known issue — see the project's remediation plan for the ongoing modularization effort). Some are split into `routes/` + `controllers/`; follow that pattern for new routes where practical.
- **Database access:** raw `pg.Pool` via `database.js` (`pgDatabase`) — not Prisma. Keep using this pattern for now; Prisma is schema/migration tooling only in this project, not a query layer (see [docs/DATABASE.md](docs/DATABASE.md)).
- **Auth:** two middlewares currently coexist (`isAuthenticated` in `server.js`, `requireAuth` in `routes/authRoutes.js`) — check which one already guards the area you're touching before assuming.
- **Test manually** with `curl` (include `X-Requested-With: XMLHttpRequest` and a session cookie for any `/api/*` route — see the smoke-test commands in this project's session history / `docs/DATABASE.md` for a working example) or through the running frontend.

## Making frontend changes

- **Where things live:** `client/src/scenes/` (route-level pages), `client/src/components/` (shared components), `client/src/context/` (auth/CSRF context), `client/src/hooks/` (e.g. `useNotifications.js`).
- **API calls:** use the centralized `client/src/api/axiosClient.js` (handles CSRF token attachment and `withCredentials` automatically) rather than raw `axios`/`fetch` — a few older files still bypass it; don't add new ones to that list.
- **Data fetching pattern:** `hooks/useNotifications.js` is the best example in the codebase (centralized polling, exponential backoff on 429) — prefer that shape over a fresh `useEffect` + local `useState` per component when a resource is used in more than one place.

## Making database schema changes (Prisma)

1. Edit `prisma/schema.prisma` to describe the new state (new model, new field, etc.).
2. Generate and apply the migration **against your local replica only**:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   This writes a new folder under `prisma/migrations/` with the actual SQL, and applies it locally. It never touches production — `prisma7.config.ts` only ever points at `prisma/.env.local` (your local replica).
3. **Read the generated `migration.sql`** before committing — the schema.prisma diff doesn't tell you if Prisma decided a change requires a `DROP COLUMN` or similar. Reviewers should read this file too, not just the schema diff.
4. Commit `prisma/schema.prisma` and the new migration folder together.
5. Getting it to production is a **separate, manual, human-run step** — never part of a normal PR merge. See [docs/DATABASE.md](docs/DATABASE.md) for the exact `migrate deploy` process and why it's deliberately not automated in CI/CD yet.

## Testing before opening a PR

There's currently no automated test suite in this project — manual verification is the real safety net until that changes. Before opening a PR:

- [ ] Backend starts cleanly (`npm run dev`), no unexpected errors in the console
- [ ] Frontend starts cleanly (`cd client && npm run dev`), no console errors in the browser
- [ ] Manually exercise the specific feature/endpoint you changed, both as an authenticated and unauthenticated user where relevant
- [ ] If you touched shared auth/session/CSRF code: confirm login, an authenticated `GET`, and logout all still behave correctly (a regression here breaks the whole app, not just one page)
- [ ] If you touched `prisma/schema.prisma`: run `npx prisma migrate status` against your local replica and confirm it reports no drift
- [ ] `node --check <file>.js` on any backend file you edited, as a quick syntax sanity check

## Opening a PR

- Branch off `main` (or whatever the current integration branch is), one logical change per PR where practical
- PR description should state: what changed, why, and how you tested it (the checklist above is a good template)
- **If the PR includes a Prisma migration**, say so explicitly in the description and link to the generated `migration.sql` — this is the one category of change that needs a second, careful reviewer pass on the actual SQL, not just the diff
- Never include a filled-in `.env.*` file, real credentials, or a database dump in a PR

## Deployment readiness checklist

Before merging/deploying:

- [ ] No real secrets, credentials, or production connection strings appear anywhere in the diff
- [ ] If a DB migration is included: it's been applied and verified against the local replica; deploying it to production is a **separate manual step** (`prisma migrate deploy`, run by a maintainer with real prod credentials, from their own machine — never automated) — see [docs/DATABASE.md](docs/DATABASE.md)
- [ ] The change has been manually smoke-tested per the checklist above

The actual production deployment process (where the app is hosted, how it's restarted, etc.) isn't fully documented yet — this repo was handed off mid-transition and that write-up is still pending. Check with the current project maintainer before assuming a deployment mechanism.

## Known caveats

- **`server.js` is large (~7,600 lines)** and mixes routing, SQL, email, Telegram bot logic, and scheduled jobs. This is known and being addressed incrementally — don't be surprised by it, and prefer extracting logic into `controllers/`/`routes/` for anything you touch rather than adding more to `server.js`.
- **The Telegram bot token in `.env.development` is currently the same live token used in production.** Starting the dev server calls the real Telegram API to (re)set the bot's webhook to whatever `WEB_APPLICATION_DOMAIN`/`WEBHOOK_BASE_URL` currently says. As shipped today those happen to already point at the production domain, so this is a no-op — but if you ever point `WEB_APPLICATION_DOMAIN` at a local ngrok tunnel to test bot features, **you will repoint the live production bot's webhook away from prod** while you're testing. Get a separate dev bot token before doing any real Telegram bot development, or use an obviously-invalid placeholder token if you don't need bot functionality (the webhook call will just fail harmlessly and the rest of the app is unaffected).
- **`DATABASE_LOCAL*` variables in `.env.example`** are vestigial — `database.js` doesn't read them. The local replica is configured via the regular `DATABASE_*` variables pointed at `localhost:5433`.
