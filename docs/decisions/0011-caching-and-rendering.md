# 0011 — Header/wishlist streaming split; `cacheComponents` deferred

- Date: 2026-07-31
- Status: accepted

## Context

Every one of the app's 20 routes builds as fully dynamic (`ƒ`). The build's
own request-tracing pointed at `components/layout/site-header.tsx`, which
called `auth()` and `getCartItemCount()` (a guest-cart-cookie read) directly
in `SiteHeader`, itself rendered from `app/[locale]/layout.tsx` — so every
page under every locale inherited a dynamic layout. Catalog pages compounded
this with their own `getSessionUser()` call to resolve wishlist heart state
for each product grid.

The plan called for a two-part fix: split the header and wishlist heart out
into `Suspense`-wrapped children so the static shell can stream ahead of
session/cart data, then spike Next.js 16's `cacheComponents` flag (which
enables `use cache` + `cacheTag` + Partial Prerendering) to see whether the
catalog's read queries could ship a static shell.

## Decision

**Ship the Suspense split.** `SiteHeader` now renders the brand, static nav
link, search box, and theme/language toggles with no data dependency, and
delegates the session-dependent nav links, wishlist/account/sign-out menu,
and cart badge to three separate async Server Components
(`HeaderNavSessionLinks`, `HeaderSessionMenu`, `HeaderCartBadge`), each
wrapped in its own `<Suspense>` with a skeleton fallback. `ProductCard`
mirrors this: a new `WishlistHeart` async component resolves session +
wishlist state itself behind a `<Suspense>` boundary, so `HomePage`,
`SearchPage`, and the PDP's related-products grid no longer call
`getSessionUser()`/`getWishlistProductIds()` before rendering anything. Pages
that already know the answer (the wishlist page itself, rendering a shopper's
own wishlist) pass a `wishlistState` prop to skip the extra lookup instead of
mounting `WishlistHeart`.

**Defer `cacheComponents`.** Enabling `cacheComponents: true` and running
`pnpm build` did not hit the anticipated blocker — next-intl built and
compiled fine. Instead, nearly every authenticated or data-driven route
(`/account/orders`, `/account/orders/[orderId]`, and by the same pattern
`/cart`, `/checkout`, `/account/wishlist`, the PDP's review section, …) failed
the build with `Uncached data was accessed outside of <Suspense>`. Cache
Components requires every request-time read (session cookies, DB queries) to
sit inside an explicit `<Suspense>` boundary with a fallback shell; reading
`requireSessionUser()`/query results directly in a page body — the pattern
used throughout this codebase — is now a hard build error, not a warning.
Fixing this for real would mean restructuring the body of most routes into a
static-shell-plus-`<Suspense>`-island shape, individually, which is a
full-app rendering migration rather than a slice of Phase 5. That is exactly
the "fighting the library" outcome the plan told us to stop at, just
triggered by the Suspense-boundary requirement rather than next-intl's locale
resolution. `cacheComponents` stays off; `next.config.ts` is unchanged.

Because the flag is off, `use cache`, `cacheTag`, and `updateTag` are
unavailable (`use cache` requires `cacheComponents: true`), so
`getFeaturedProducts`, `getCategories`, `getProductBySlug`, `findProducts`,
and `getRatingSummaries` are not cached, and the fourteen
`revalidatePath("/", "layout")` calls across `features/*` are left as-is —
swapping them for `updateTag` on tags that are never set by a `cacheTag` call
would be a no-op, not a real migration.

## Consequences

- The header and wishlist heart genuinely stream now: React's streaming SSR
  sends the static shell before `auth()`/cart-cookie/wishlist reads resolve,
  independent of `cacheComponents`. This is a real TTFB improvement,
  verifiable via the network waterfall, even though `next build`'s route
  table still marks every route `ƒ` — that marker reflects whether a static
  shell can be *prerendered at build time*, which still requires the flag.
- Adopting Cache Components is still worth doing, but needs its own phase: an
  inventory of every route's dynamic reads, a `<Suspense>` boundary and
  skeleton per read, and only then `use cache`/`cacheTag` on the now-isolated
  query layer. Until then, cache invalidation stays on `revalidatePath`.
- `getWishlistProductIds` (the batched, page-level lookup) is now unused in
  application code — grids resolve wishlist state per-card through
  `WishlistHeart`/`isProductWishlisted` instead. It is left in
  `features/wishlist/queries.ts` since it is a reasonable general-purpose
  query and may be reused (e.g. an admin view); trading one batched query for
  N per-card queries is an acceptable cost at this catalog's size and is what
  makes the grids independent of a page-level session fetch in the first
  place.
