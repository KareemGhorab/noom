# 0013 — Multi-currency via per-variant prices

- Date: 2026-07-31
- Status: accepted

## Context

Noom's catalog and checkout assumed a single AED amount on each variant.
Shoppers (and demos) need USD as well, but converting at read time with a
live FX rate would make totals non-deterministic, break order history, and
fight the demo's "no payment charge" simplicity. Prices must stay integer
minor units the merchant publishes.

## Decision

- Introduce a `currency` table (`code`, `minorUnits`, `isDefault`) and a
  `variant_price` table keyed by `(variantId, currency)`.
- Drop `product.currency`. Settlement currency is chosen by the shopper, not
  owned by the product.
- Resolve the active currency as: signed-in `user.currency` → `noom_currency`
  cookie → default currency (AED). Switching updates the cookie and, when
  signed in, the user row.
- Catalog filters/sorts, cart lines, and checkout all read `variant_price`
  for the active currency. A missing row means the SKU is unpurchasable
  (`priceUnavailable`) — never a silent FX conversion.
- Snapshot `order.currency` and `order_item.currency` at checkout so history
  stays self-describing.
- Seed AED (default) and USD with a fixed integer USD table (~0.27× AED),
  not a live rate.

## Consequences

- Adding a currency means inserting a `currency` row and prices for every
  SKU that should be buyable in it; there is no automatic fallback amount.
- Cart lines can become unpriced if the shopper switches to a currency that
  lacks a row — the cart surface shows `priceUnavailable` and blocks
  checkout until they switch back or remove the line.
- `product_variant.price_cents` remains as the seed/default AED amount used
  to populate `variant_price`; the shopper read path ignores it.
