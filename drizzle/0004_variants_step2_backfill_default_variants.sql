-- Every existing product gets exactly one "default" variant (empty
-- option_values) that carries its current price and stock forward, so
-- pre-variant carts, orders, and catalog rows keep working unmodified
-- until step 3 repoints them at variant_id.
INSERT INTO "product_variant" ("product_id", "sku", "price_cents", "stock", "option_values")
SELECT "id", "slug" || '-default', "price_cents", "stock", '{}'::jsonb
FROM "product";
