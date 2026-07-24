# Architecture

Noom is a modular monolith: vertical feature slices with shared infrastructure.

## Layers

```
app/[locale]/*          Route handlers & page composition
features/*              Feature actions, queries, UI-specific logic
lib/validations/*       Zod contracts (shared input validation)
lib/domain/*            Pure helpers (totals, formatting, search)
lib/db/*                Drizzle schema, client, seed
components/*            Shared UI (layout, catalog, cart, auth)
i18n/* + messages/*     Locale routing and copy
auth.ts                 Auth.js configuration
proxy.ts                Locale proxy (next-intl)
```

## Data flow

1. Pages call `features/*/queries.ts` for reads.
2. Client forms post to `features/*/actions.ts` server actions.
3. Actions validate with `lib/validations/*`, mutate via Drizzle, revalidate paths.
4. Guest carts use `noom_guest_id` cookie; carts merge on sign-in.

## Checkout

Orders are persisted with snapshot line items. No payment provider is integrated; checkout banner marks demo mode.

## Auth

- Credentials (bcrypt password hash on `user.password_hash`)
- Magic link via `verificationToken` + console URL when email is not configured
- Google OAuth only when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set
- JWT session strategy (required for credentials)

## i18n

Locales: `en` (default), `ar` (RTL). All UI strings come from JSON message files.
