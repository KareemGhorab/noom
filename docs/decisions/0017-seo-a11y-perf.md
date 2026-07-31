# 0017 — SEO, accessibility, and performance budgets

- Date: 2026-07-31
- Status: accepted

## Context

Phase 12 closes the shopper MVP with crawlability, a baseline accessibility
gate, and a lightweight Lighthouse budget. Earlier phases already ship
`generateMetadata` on key storefront pages; this ADR covers the remaining
file-convention SEO surfaces and CI checks.

## Decision

### Sitemap and robots

- `app/sitemap.ts` emits locale-prefixed URLs for home, search, every product
  slug, and category search links (`/search?category=`). Absolute URLs use
  `env.AUTH_URL` from `lib/env.ts`.
- `app/robots.ts` allows public crawl and disallows `/api/`, per-locale
  `/account/`, `/auth/`, and `/checkout/` paths. It points crawlers at
  `/sitemap.xml`.

### Open Graph images

- Locale default: `app/[locale]/opengraph-image.tsx` via `ImageResponse`
  (next/og) — brand + short subtitle.
- Product: `app/[locale]/product/[slug]/opengraph-image.tsx` — brand +
  localized title. Styling stays doodle-simple (white field, ink border,
  red accent bar matching theme tokens).
- `metadataBase` on the locale layout resolves relative OG/canonical URLs
  against `AUTH_URL`.

### Accessibility

- `@axe-core/playwright` is a devDependency.
- `e2e/a11y.spec.ts` visits home, search, PDP, cart, and login and asserts
  **zero critical** axe violations (WCAG 2 A/AA tags). Serious/moderate
  issues are not hard-failing to keep the demo suite stable.
- The check runs inside the existing `pnpm test:e2e` / CI e2e job.

### Lighthouse budget

- Budgets live in `e2e/lighthouse.budget.json`: performance ≥ 0.5,
  accessibility ≥ 0.9 (generous for a dynamic demo).
- `pnpm lighthouse:ci` runs `scripts/lighthouse-budget.mjs` against
  `PLAYWRIGHT_BASE_URL` or `http://localhost:3000` using `lighthouse` +
  `chrome-launcher`. The server must already be running.
- CI starts `pnpm start` after e2e and runs the budget step with
  `continue-on-error: true` so Lighthouse flake does not block merges.

## Consequences

- Sitemap generation hits Postgres for product/category slugs; it inherits
  the same env/DB requirements as the rest of the app.
- Axe critical failures block CI via e2e; Lighthouse regressions are
  advisory until the demo is tuned for stricter scores.
- Auth, account, and checkout remain noindex via robots disallow rather than
  per-page `robots` metadata.
