# 0016 — Remaining shopper features

- Date: 2026-07-31
- Status: accepted

## Context

Phase 11 closes the shopper surface that was still missing from the doodle
demo: promo codes at checkout, wishlist → cart, recently viewed, back-in-stock
alerts, and GDPR-style export / delete. None of these need admin UI; they
have to stay transactional where money-ish state is involved and honest about
JWT session limits.

## Decision

### Discount codes

- Table `discount` with `type` `percent|fixed`. Percent uses `percent_int` and
  ignores currency; fixed uses `value_cents` and requires `currency` to match
  the order.
- Applied inside `placeOrderAction`'s transaction: validate with
  `computeDiscountAmount`, then `UPDATE … SET usage_count = usage_count + 1`
  with `WHERE usage_count < usage_cap` (and active / not expired). A failed
  claim rolls back the order.
- Persisted on the order as `discount_code` + `discount_cents`. Order
  `total_cents` is already net of the discount.
- Seeded demos: `NOOM10` (10%) and `FLAT20` (AED 20).

### Stock subscriptions

- Table `stock_subscription` unique on `(email, variant_id)`. PDP form when
  the selected variant is out of stock; rate-limited.
- `cancelOrderAction` restores stock, then `notifyStockSubscribers` mails
  pending rows and stamps `notified_at`. Mail runs outside the cancel
  transaction so a transport failure cannot undo the cancel.

### Account export / delete

- `GET /api/account/export` returns a JSON attachment for the session user
  (profile, addresses, orders, wishlist, reviews).
- `deleteAccountAction` requires password (or email re-type for magic-link-only
  users), deletes the `user` row (cascades handle owned rows; orders keep
  `user_id` null via `ON DELETE SET NULL`), then signs out locally.
- **JWT sessions elsewhere expire naturally** — Auth.js JWT mode has no
  server-side revocation list in this demo. Deleting the user invalidates
  credential/magic-link re-auth; other devices keep a stale JWT until expiry.

### Recently viewed / wishlist → cart

- Cookie `noom_recently_viewed` (max 8 slugs), written from a PDP tracker
  action; home shows a strip when non-empty. No DB table.
- Wishlist actions add the first in-stock, priced variant (active currency)
  for one product or the whole list.

## Consequences

- Discount races are settled by the conditional usage update, not by optimistic
  UI.
- Fixed codes are currency-specific; switching currency at checkout can make
  `FLAT20` invalid while `NOOM10` still works.
- Back-in-stock mail uses the same console/SMTP transport as order mail.
- Account deletion is destructive for personal data but preserves order
  history for demo reporting without a user id.
