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
pnpm db:push
pnpm db:seed
pnpm dev
```

Postgres listens on host port **5434** (mapped from container 5432) to avoid conflicts with a local Postgres on 5432.

Demo user: `demo@noom.app` / `demo1234`

## Architecture

- Modular monolith under `features/*`
- Shared contracts in `lib/validations/*`
- Pure helpers in `lib/domain/*`
- Database schema in `lib/db/schema.ts`
- Locale-aware routes under `app/[locale]/*`
- Request proxy in `proxy.ts` (Next.js 16 middleware replacement)

See `docs/architecture.md`, `docs/map.md`, and ADRs in `docs/decisions/`.

## Must flows

1. Browse/search catalog
2. Product detail + add to cart
3. Guest or authenticated cart
4. Demo checkout (no payment charge)
5. Auth: register, credentials login, magic link (console fallback)
6. Account profile, order history/detail, wishlist (Phase 2)

## Conventions

- All user-facing strings via next-intl (`messages/en.json`, `messages/ar.json`)
- Server actions live in `features/*/actions.ts`
- Read queries in `features/*/queries.ts`
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
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Push Drizzle schema |
| `pnpm db:seed` | Seed demo data |
