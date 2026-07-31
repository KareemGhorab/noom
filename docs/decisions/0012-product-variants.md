# 0012 — Product variants

- Date: 2026-07-31
- Status: accepted

## Context

Price and stock cannot live on `product` once a SKU can vary by size or color.
A full option algebra (product → option → option_value → variant_option_value)
is the textbook model, but Noom's catalog is a small demo: a handful of SKUs,
at most one or two options per product, and no admin tooling that needs to
recombine options on the fly.

Cart and order lines already need a stable FK to "the thing that has stock,"
and checkout must snapshot a human-readable option line so history stays
readable after labels change.

## Decision

- Introduce `product_option` (key + localized labels + position) and
  `product_variant` (sku, price, stock, `option_values` jsonb).
- Remove `price_cents` and `stock` from `product`. Every product has at least
  one variant; products without shopper-facing options use a default variant
  with empty `option_values`.
- Store variant selections as a flat `{ [optionKey]: value }` map on the
  variant row rather than a three-table join of option values. Uniqueness is
  `(product_id, option_values)`.
- Point `cart_item` and `order_item` at `variant_id`. Order lines also store
  `option_summary_en` / `option_summary_ar` snapshots built at checkout.
- Catalog listing filters and sorts aggregate over variant prices (min for
  range filters and ascending sort; max for descending sort). Cards show the
  price envelope and pooled stock.

## Consequences

- Matching a shopper's selected options to a SKU is an in-memory equality check
  on the jsonb map, which is fine at demo scale and avoids join churn on every
  PDP render.
- jsonb uniqueness means two variants cannot share the same option map, but
  Postgres treats json object key order carefully — seed and app code always
  write maps with stable keys.
- There is no separate "available values" table: value lists on the PDP are
  derived from the variants that exist. Adding a size means inserting a
  variant, not a value row.
- Cancel / reorder restore or re-add by `variant_id`, skipping lines whose
  variant was deleted (`on delete set null` on order items).
