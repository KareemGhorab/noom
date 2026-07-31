# Architecture

Noom is a modular monolith: vertical feature slices with shared infrastructure.

## Layers

```
app/[locale]/*          Route handlers & page composition
features/*              Feature actions, queries, UI-specific logic
lib/validations/*       Zod contracts (shared input validation)
lib/domain/*            Pure helpers (totals, formatting, stock, access rules)
lib/db/*                Drizzle schema, client, seed
lib/email/*             Mail transports
components/*            Shared UI (layout, catalog, cart, reviews, auth)
i18n/* + messages/*     Locale routing and copy
auth.ts                 Auth.js configuration
proxy.ts                Locale proxy (next-intl)
```

## Data flow

1. Pages call `features/*/queries.ts` for reads.
2. Client forms post to `features/*/actions.ts` server actions.
3. Actions validate with `lib/validations/*`, mutate via Drizzle, revalidate paths.
4. Guest carts use the `noom_guest_id` cookie; carts and guest orders are
   claimed on sign-in.

## Error contract

Server actions never return a sentence. They return `{ ok: false, code }` where
`code` is an `ActionErrorCode` from `lib/errors.ts`, and the client resolves it
against the `Errors` message namespace. Adding a code means adding a
translation in both `messages/en.json` and `messages/ar.json`; the parity test
in `messages.test.ts` enforces it.

## Untrusted input

- Locales are resolved through `lib/i18n/locale.ts` rather than interpolated
  into URLs, which is what closed the magic-link open redirect.
- UUID route params go through `parseUuid`, so a malformed id is a 404 rather
  than a Postgres type error.
- Catalog search params are parsed by `catalogQuerySchema`, where each field
  degrades to its default independently instead of failing the whole listing.
- Search terms escape `%` and `_` before reaching `ILIKE`.

## Catalog variants

Every product has at least one `product_variant` (a default with empty
`option_values` when it does not vary). Price and stock live on the variant;
cart and order lines store `variant_id` plus option snapshots. See
[ADR 0012](./decisions/0012-product-variants.md).

## Multi-currency

Settlement currencies are AED and USD. Amounts are stored per variant in
`variant_price` — there is no FX conversion at read time. Active currency
resolves as signed-in `user.currency` → `noom_currency` cookie → AED. See
[ADR 0013](./decisions/0013-multi-currency.md).

## Discounts

Checkout accepts seeded promo codes (`NOOM10`, `FLAT20`). Eligibility and
amount are pure helpers in `lib/domain/discount.ts`; claiming increments
`usage_count` inside the place-order transaction. See
[ADR 0016](./decisions/0016-shopper-features.md).

## Caching / rendering

The header and wishlist heart are split into Suspense-wrapped children so the
static shell can stream ahead of session/cart reads. Enabling Next.js
`cacheComponents` / PPR is deferred. See
[ADR 0011](./decisions/0011-caching-and-rendering.md).

## Checkout

Orders are persisted with snapshot line items inside a single transaction:
stock is validated, the order and its items are inserted, stock is decremented
relatively (`stock = stock - n WHERE stock >= n`), the cart is cleared, and an
address is optionally saved. Optional discount codes are claimed in the same
transaction. The confirmation email is sent afterwards so a mail failure
cannot roll back a placed order. No payment provider is integrated; the
checkout banner marks demo mode.

Confirmation pages are readable by the order's owner or by whoever holds the
short-lived `noom_last_order` cookie, and nobody else. Guests can re-establish
that cookie via `/orders/lookup` (email + order id).

## Orders

A `placed` order can be cancelled by its owner, which stamps `cancelledAt` and
restores stock in the same transaction (and may notify back-in-stock
subscribers). Reorder pushes the order's lines back into the cart, clamped to
current stock. Guest orders record `guestId` and are claimed in the Auth.js
`signIn` callback. Printable invoices exist under account and confirmation
routes.

## Reviews

One review per shopper per product, enforced by a unique `(user_id,
product_id)` constraint, and only after a non-cancelled order containing the
product. Grids fetch aggregates through `getRatingSummaries(productIds)` in one
grouped query; the `rating` sort uses a correlated average so unreviewed
products sort last rather than disappearing. Reviews v2 adds helpful votes,
report, star filter, and sort ([ADR 0015](./decisions/0015-reviews-v2.md)).

## Auth

- Credentials (bcrypt password hash on `user.password_hash`)
- Magic link via `verificationToken`, consumed by a POST interstitial so email
  scanners cannot burn a single-use token; tokens are claimed with an atomic
  `DELETE ... RETURNING`
- Password reset via `password_reset_token`, storing a bcrypt hash of the token
- Google OAuth only when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set
- JWT session strategy (required for credentials), 7-day max age

JWT sessions cannot be revoked server-side, so a password change does not sign
other devices out. The account UI states this.

## Email

`lib/email/send.ts` logs to the console by default and uses SMTP when
`EMAIL_SERVER` and `EMAIL_FROM` are set. Links are redacted from production
logs.

## i18n

Locales: `en` (default), `ar` (RTL). All UI strings come from JSON message
files, including order statuses and server-action errors.

## SEO / a11y / performance

- `app/sitemap.ts` and `app/robots.ts` expose crawl rules; OG images use
  `ImageResponse` under `app/[locale]/` and product slug routes.
- Playwright axe checks fail on critical violations (`e2e/a11y.spec.ts`).
- `pnpm lighthouse:ci` enforces demo-generous category budgets against a
  running server.

See [ADR 0017](./decisions/0017-seo-a11y-perf.md).
