# 0010 — CI pipeline and versioned migrations

- Date: 2026-07-31
- Status: accepted

## Context

The project had no CI: `typecheck`, `lint`, `test`, and `test:e2e` were only
ever run locally, on the author's judgment. Schema changes were applied with
`drizzle-kit push`, which diffs `lib/db/schema.ts` against the live database
and mutates it directly — there was no SQL migration history in the repo. Two
incidents already came from this: a unique-constraint addition that `push`
refused to apply non-interactively against a table with existing data, and the
`password_reset_token` table, both of which required hand-written SQL run
directly against the container with `psql` and then reconciled with schema.ts
after the fact. Neither incident left a record of what changed or why, and
`push` has no rollback.

## Decision

- Add `.github/workflows/ci.yml`: a single job that installs with a frozen
  lockfile, then runs `typecheck`, `lint`, `test`, applies migrations, builds,
  and runs `test:e2e` against a `postgres:16` service container on port 5434
  (matching local `docker-compose.yml` so `DATABASE_URL` needs no
  per-environment branching). `CI=1` makes `playwright.config.ts` use a single
  worker, two retries, and a fresh dev server per run.
- Generate a baseline migration with `drizzle-kit generate` capturing the
  entire current schema as `drizzle/0000_baseline.sql`, and commit it with its
  journal. Going forward, schema edits are made in `lib/db/schema.ts`, then
  `pnpm db:generate` writes the next numbered migration, and both files are
  committed together.
- Switch the documented and CI-driven setup path from `db:push` to
  `db:migrate`. `db:push` remains in `package.json` for fast local prototyping
  only — its result must be captured as a generated migration before merging,
  since CI and `test:e2e`'s global setup apply migrations, not the live
  schema diff.
- `e2e/global-setup.ts` now runs `db:migrate` before `db:seed`, so a fresh
  checkout with an empty database (as CI always has) is fully set up by the
  existing E2E entry point without a separate provisioning step.

## Consequences

- Local databases created before this change predate migration tracking and
  have no `__drizzle_migrations` table. `drizzle-kit migrate` cannot reconcile
  that automatically; the fix is `docker compose down -v && docker compose up
  -d` before the first `pnpm db:migrate`, which is safe because all local data
  is demo data. This is documented in `AGENTS.md`.
- Every future schema change is two files (schema.ts edit + generated SQL)
  instead of one, and forgetting to run `db:generate` means CI's `db:migrate`
  step silently does nothing — the schema drift would only surface as a
  runtime error in the app, not a CI failure. A follow-up could add a CI check
  that fails if `db:generate` would produce a diff, but that is not done here.
- CI has no caching for the Playwright browser binary or the Next.js build
  cache; both are downloaded/rebuilt on every run. Acceptable for current CI
  volume; revisit if run times become a problem.
