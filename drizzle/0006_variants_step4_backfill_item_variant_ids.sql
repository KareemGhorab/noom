-- Repoint every existing cart and order line at the default variant created
-- in step 2 for its product, ahead of step 5 dropping product_id entirely.
UPDATE "cart_item" AS ci
SET "variant_id" = pv."id"
FROM "product_variant" AS pv
WHERE pv."product_id" = ci."product_id"
  AND pv."option_values" = '{}'::jsonb;
--> statement-breakpoint
UPDATE "order_item" AS oi
SET "variant_id" = pv."id"
FROM "product_variant" AS pv
WHERE pv."product_id" = oi."product_id"
  AND pv."option_values" = '{}'::jsonb
  AND oi."product_id" IS NOT NULL;
