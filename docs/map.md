# Repository map

## Entry points

| Path | Role |
|------|------|
| `app/[locale]/page.tsx` | Home — categories + featured products |
| `app/[locale]/search/page.tsx` | Search / category filter |
| `app/[locale]/product/[slug]/page.tsx` | Product detail |
| `app/[locale]/cart/page.tsx` | Cart |
| `app/[locale]/checkout/page.tsx` | Checkout form |
| `app/[locale]/checkout/confirmation/[orderId]/page.tsx` | Order confirmation |
| `app/[locale]/auth/*` | Login, register, magic link |
| `app/[locale]/account` | Profile |
| `app/[locale]/account/orders` | Order history + detail |
| `app/[locale]/account/wishlist` | Saved products |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js handlers |
| `app/api/auth/magic-link/verify/route.ts` | Magic link completion |
| `proxy.ts` | Locale routing |
| `auth.ts` | Auth.js config |

## Features

| Module | Files |
|--------|-------|
| Catalog | `features/catalog/queries.ts` |
| Cart | `features/cart/actions.ts`, `queries.ts`, `merge.ts` |
| Checkout | `features/checkout/actions.ts` |
| Orders | `features/orders/queries.ts` |
| Account | `features/account/actions.ts`, `queries.ts` |
| Wishlist | `features/wishlist/actions.ts`, `queries.ts` |
| Auth | `features/auth/actions.ts`, `sign-out.ts` |

## Shared lib

| Path | Purpose |
|------|---------|
| `lib/db/schema.ts` | Postgres tables |
| `lib/db/seed.ts` | Demo categories, products, user, sample order |
| `lib/validations/*` | Zod schemas + tests |
| `lib/domain/order.ts` | Totals + price formatting |
| `lib/cart/guest.ts` | Guest cookie helpers |

## UI

| Path | Purpose |
|------|---------|
| `components/layout/site-header.tsx` | Search, cart, auth, locale, theme |
| `components/catalog/product-card.tsx` | Product grid card |
| `components/ui/*` | doodle-ui primitives |

## E2E

| Path | Purpose |
|------|---------|
| `e2e/*.spec.ts` | Playwright Must-flow specs |
| `e2e/helpers/auth.ts` | Demo login helper |
| `playwright.config.ts` | Playwright + webServer config |

## Docs & rules

- `AGENTS.md` — primary agent guide
- `docs/decisions/` — ADRs
- `.cursor/rules/noom.mdc` — Cursor rules
