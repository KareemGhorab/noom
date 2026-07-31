# Noom — Agent Guide

Noom is a shopper-only demo marketplace MVP built on Next.js 16 App Router.

## Stack

- Next.js 16 App Router, React 19, Tailwind CSS v4
- Postgres 16 + Drizzle ORM
- Auth.js (`next-auth@beta`) with JWT sessions
- next-intl (`en`, `ar` with RTL)
- next-themes (class strategy)
- Zod validation, Vitest tests
- UI: `@kareem-ghorab/theme` + `components/ui/*` (doodle-ui)

## Local setup

```bash
docker compose up -d
cp .env.example .env   # if needed
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Postgres listens on host port **5434** (mapped from container 5432) to avoid conflicts with a local Postgres on 5432.

If your local database predates the baseline migration (created via the old `db:push`-only workflow), reset it once with `docker compose down -v && docker compose up -d` before running `pnpm db:migrate`. All local data is demo data, so this is safe.

Demo user: `demo@noom.app` / `demo1234`

## Architecture

- Modular monolith under `features/*`
- Shared contracts in `lib/validations/*`
- Pure helpers in `lib/domain/*`
- Database schema in `lib/db/schema.ts`, versioned as SQL migrations in `drizzle/` and applied with `db:migrate`
- Locale-aware routes under `app/[locale]/*`
- Request proxy in `proxy.ts` (Next.js 16 middleware replacement)

See `docs/architecture.md`, `docs/map.md`, and ADRs in `docs/decisions/`.

## Must flows

1. Browse/search catalog with sort, price filter, pagination, and product variants
2. Product detail + add to cart (variant picker), related products, reviews v2 (helpful/report/sort)
3. Guest or authenticated cart; multi-currency prices (AED / USD)
4. Demo checkout (no payment charge) with saved-address prefill and discount codes (`NOOM10`, `FLAT20`)
5. Auth: register, email verification, credentials login, magic link (console fallback), password reset
6. Account profile, change password, order history/detail with cancel and reorder, saved addresses, wishlist → cart
7. Guest order lookup (`/orders/lookup`), printable invoices, account JSON export / delete
8. SEO surfaces: `/sitemap.xml`, `/robots.txt`, locale + product Open Graph images

## Conventions

- All user-facing strings via next-intl (`messages/en.json`, `messages/ar.json`); both files must have identical key sets
- Server actions live in `features/*/actions.ts` and return an `ActionErrorCode` from `lib/errors.ts`, never an English sentence
- Read queries in `features/*/queries.ts`
- Validate untrusted route params: `parseUuid` for ids, `resolveLocale` for locales
- Write Vitest tests for Zod schemas and pure domain helpers first
- Do not invent dependency APIs; read Next.js 16 docs in `node_modules/next/dist/docs/` when unsure

## Theme

Global styles in `app/globals.css`:

```css
@import "@kareem-ghorab/theme/fonts.css";
@import "tailwindcss";
@import "@kareem-ghorab/theme/styles.css";
@custom-variant dark (&:is(.dark *));
```

Arabic uses Cairo font fallback for `[lang=ar]` / `html[dir=rtl]`.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm test` | Run Vitest |
| `pnpm test:e2e` | Run Playwright E2E (seeds DB, starts `pnpm dev`; includes axe critical checks in `e2e/a11y.spec.ts`) |
| `pnpm test:e2e:ui` | Playwright UI mode |
| `pnpm lighthouse:ci` | Lighthouse budget vs a running server (`PLAYWRIGHT_BASE_URL` or `http://localhost:3000`); see `e2e/lighthouse.budget.json` |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a new SQL migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly, bypassing migrations (local prototyping only, never CI or shared databases) |
| `pnpm db:seed` | Seed demo data |

### Schema changes

Edit `lib/db/schema.ts`, then run `pnpm db:generate` to write a new file under `drizzle/`, and commit both. `db:push` remains available for quick local iteration but its result must always be captured as a generated migration before merging, since CI and `test:e2e` apply the repo's migrations rather than pushing the live schema.

### E2E notes

- Requires Postgres (`docker compose up -d`) and a local `.env` with `DATABASE_URL` + `AUTH_SECRET`
- Specs live in `e2e/`; config in `playwright.config.ts`
- Global setup runs `db:migrate` then re-seeds demo data before the run
- Default project is Chromium only
- `e2e/a11y.spec.ts` fails on axe **critical** violations for home, search, PDP, cart, and login
- CI (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, `test`, then `test:e2e` against a `postgres:16` service container, then an optional Lighthouse budget step (`continue-on-error`)

### Lighthouse

With the app running (`pnpm build && pnpm start`, or `pnpm dev`):

```bash
pnpm lighthouse:ci
```

Budgets (demo-generous): performance ≥ 0.5, accessibility ≥ 0.9. Details in ADR `docs/decisions/0017-seo-a11y-perf.md`.
