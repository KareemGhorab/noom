# 0005 — Phase 2 account, orders, wishlist

- Date: 2026-07-24
- Status: partly superseded by [0009](0009-reviews-and-ratings.md)

## Context

Phase 1 shipped browse → cart → demo checkout → auth. Shoppers still needed a place to manage identity, revisit orders, and save products without expanding into seller tooling.

## Decision

- Auth-gated `/account` area: profile, order history + detail, wishlist
- Wishlist is a simple `wishlist_item` composite key (`user_id`, `product_id`)
- Order detail is ownership-checked via `canViewOrder`
- Sellers, payments, and reviews remain deferred (reviews shipped later; see
  [0009](0009-reviews-and-ratings.md))

## Consequences

- Header exposes Account / Orders / Wishlist for signed-in users
- Seed populates demo wishlist items alongside the sample order
