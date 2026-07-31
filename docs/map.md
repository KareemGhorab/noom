# Repository map

## Entry points

| Path | Role |
|------|------|
| `app/[locale]/page.tsx` | Home — categories + featured products + recently viewed |
| `app/[locale]/search/page.tsx` | Catalog listing — search, category, sort, price filter, pagination |
| `app/[locale]/product/[slug]/page.tsx` | Product detail, variants, related products, reviews, back-in-stock |
| `app/[locale]/cart/page.tsx` | Cart |
| `app/[locale]/checkout/page.tsx` | Checkout form (address prefill, discount codes) |
| `app/[locale]/checkout/confirmation/[orderId]/page.tsx` | Order confirmation (session or `noom_last_order` cookie) |
| `app/[locale]/checkout/confirmation/[orderId]/invoice/page.tsx` | Printable invoice for confirmation holders |
| `app/[locale]/orders/lookup/page.tsx` | Guest order lookup (email + order id → confirmation cookie) |
| `app/[locale]/account/orders/[orderId]/invoice/page.tsx` | Printable invoice for signed-in order owners |
| `app/[locale]/auth/login`, `register`, `magic-link` | Sign in and sign up |
| `app/[locale]/auth/magic-link/verify` | POST interstitial that consumes a magic-link token |
| `app/[locale]/auth/verify-email` | Email verification confirm |
| `app/[locale]/auth/forgot-password`, `reset-password` | Password reset |
| `app/[locale]/account` | Profile, change password, export data, delete account |
| `app/[locale]/account/orders` | Order history (paginated) + detail, cancel, reorder |
| `app/[locale]/account/addresses` | Saved addresses |
| `app/[locale]/account/wishlist` | Saved products (paginated) + add to cart |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js handlers |
| `app/api/account/export/route.ts` | Session JSON export download |
| `app/sitemap.ts` | Locale-aware sitemap (home, search, categories, products) |
| `app/robots.ts` | Crawl rules; disallows api/account/auth/checkout |
| `app/[locale]/opengraph-image.tsx` | Default locale OG image (`ImageResponse`) |
| `app/[locale]/product/[slug]/opengraph-image.tsx` | Product OG image |
| `app/[locale]/error.tsx`, `app/global-error.tsx` | Localized / minimal error boundaries |
| `app/[locale]/{search,product/[slug],cart,account}/loading.tsx` | Route-segment skeletons |
| `app/[locale]/dev-force-error` | Test-only route that always throws (404s in production); backs `e2e/error-boundary.spec.ts` |
| `proxy.ts` | Locale routing |
| `auth.ts` | Auth.js config |

## Features

| Module | Files |
|--------|-------|
| Catalog | `features/catalog/queries.ts` (`findProducts`, related products, `listProductSlugs`), `recently-viewed-actions.ts` |
| Cart | `features/cart/actions.ts`, `queries.ts`, `merge.ts` |
| Checkout | `features/checkout/actions.ts` |
| Orders | `features/orders/actions.ts`, `queries.ts` |
| Addresses | `features/addresses/actions.ts`, `queries.ts` |
| Reviews | `features/reviews/actions.ts`, `queries.ts` |
| Account | `features/account/actions.ts`, `queries.ts` |
| Wishlist | `features/wishlist/actions.ts`, `queries.ts` |
| Stock | `features/stock/actions.ts`, `notify.ts` |
| Currency | `features/currency/actions.ts` |
| Auth | `features/auth/actions.ts`, `queries.ts`, `sign-out.ts` |

## Shared lib

| Path | Purpose |
|------|---------|
| `lib/db/schema.ts` | Postgres tables; `product` title/description columns carry `pg_trgm` GIN indexes for `ILIKE` search |
| `lib/db/seed.ts` | Demo categories, products, variants, users, orders, address, reviews, discounts |
| `lib/env.ts` | Startup validation of environment variables |
| `lib/errors.ts` | `ActionErrorCode` contract for server actions |
| `lib/email/send.ts` | Console transport by default, SMTP when configured |
| `lib/i18n/locale.ts` | `resolveLocale` and `localePath` |
| `lib/i18n/currency.ts` | `resolveCurrency` against supported codes (AED, USD) |
| `lib/currency/preference.ts` | Active currency: user → cookie → AED |
| `lib/validations/*` | Zod schemas + tests |
| `lib/domain/*` | Pure helpers: order totals, cart clamping, catalog stock, addresses, reviews, order access, discounts, pricing |
| `lib/cart/guest.ts` | Guest cookie helpers |
| `lib/catalog/recently-viewed.ts` | Cookie-backed recently viewed slugs |
| `lib/domain/discount.ts` | Pure discount eligibility + amount |
| `lib/orders/confirmation-cookie.ts` | Short-lived `noom_last_order` cookie |
| `lib/domain/rate-limit.ts` | Pure fixed-window helpers (`windowStart`, `isOverLimit`) |
| `lib/rate-limit/consume.ts`, `limits.ts` | Postgres-backed atomic counter + per-action budgets |
| `lib/request/client-ip.ts` | Resolves `x-forwarded-for` / `x-real-ip` for rate-limit keys |
| `lib/validations/pagination.ts` | `parsePageQuery` for order history / wishlist paging |

## UI

| Path | Purpose |
|------|---------|
| `components/layout/site-header.tsx` | Static shell: brand, search, locale, currency, theme |
| `components/layout/currency-switcher.tsx` | Header currency switcher (AED / USD) |
| `components/layout/header-nav-session-links.tsx`, `header-session-menu.tsx`, `header-cart-badge.tsx` | Session/cart-dependent header pieces, each its own `<Suspense>` child so the shell streams first |
| `components/catalog/product-card.tsx` | Product grid card with stock and rating |
| `components/catalog/variant-picker.tsx` | PDP option / quantity / add-to-cart |
| `components/catalog/wishlist-heart.tsx` | Resolves session + wishlist state per card behind `<Suspense>`; pass `wishlistState` to `ProductCard` instead when the caller already knows it |
| `components/catalog/catalog-toolbar.tsx`, `pagination.tsx` | URL-driven sort, price filter, paging |
| `components/catalog/back-in-stock-form.tsx` | Out-of-stock email subscription |
| `components/reviews/*` | Star rating, distribution, review list/form, helpful/report |
| `components/account/*` | Profile, password, address forms, danger zone |
| `components/orders/*` | Order actions, invoice, guest lookup form |
| `components/ui/*` | doodle-ui primitives |

## E2E & quality

| Path | Purpose |
|------|---------|
| `e2e/*.spec.ts` | Playwright Must-flow and regression specs |
| `e2e/a11y.spec.ts` | axe-core critical violation gate (home, search, PDP, cart, login) |
| `e2e/lighthouse.budget.json` | Lighthouse category budgets for `pnpm lighthouse:ci` |
| `scripts/lighthouse-budget.mjs` | Programmatic Lighthouse runner |
| `e2e/helpers/auth.ts` | Demo login helper |
| `playwright.config.ts` | Playwright + webServer config |

## Docs & rules

- `AGENTS.md` — primary agent guide
- `docs/decisions/` — ADRs (through `0017-seo-a11y-perf.md`)
- `.cursor/rules/noom.mdc` — Cursor rules
