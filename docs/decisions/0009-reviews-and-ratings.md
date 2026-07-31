# 0009 — Reviews and ratings

- Date: 2026-07-31
- Status: accepted
- Supersedes: [0005](0005-phase-2-account-wishlist.md) (the deferral of reviews)

## Context

ADR 0005 deferred reviews along with sellers and payments. Sellers and payments
are still out of scope, but reviews turned out to be different in kind: the
catalog already offered a "Top rated" sort with nothing behind it, and a demo
marketplace without ratings reads as unfinished rather than as deliberately
scoped.

## Decision

- New `review` table with a unique `(user_id, product_id)` constraint, a
  `rating BETWEEN 1 AND 5` check, and an index on `product_id`. The unique
  constraint is the single source of truth for "one review per shopper per
  product": editing a review is an upsert against it, not a separate code path.
- Reviews are gated on a purchase. The shopper must have a non-cancelled order
  containing the product, which is only meaningful because Phase 4 made
  `cancelled` a real status.
- Rating aggregates are fetched with `getRatingSummaries(productIds)`, one
  grouped query per grid, rather than one query per card.
- The `rating` sort uses a correlated average with `coalesce(..., 0)` so
  unreviewed products sort last instead of dropping out of the listing, which a
  join-based average would do.
- Star display rounds to the nearest whole star; the numeric average keeps one
  decimal. Half stars are not part of the doodle theme.

## Consequences

- Seed data now creates reviewer accounts with matching orders, because seeding
  a review without a purchase would contradict the rule the UI enforces.
- Deleting a product cascades its reviews; deleting a user does too.
- There is no moderation, no helpfulness voting, and no reply. A shopper can
  edit or delete their own review and nothing else.
