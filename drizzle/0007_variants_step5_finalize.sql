ALTER TABLE "cart_item" DROP CONSTRAINT "cart_item_cart_id_product_id_unique";--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "product_stock_non_negative";--> statement-breakpoint
ALTER TABLE "cart_item" DROP CONSTRAINT "cart_item_product_id_product_id_fk";
--> statement-breakpoint
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_product_id_product_id_fk";
--> statement-breakpoint
DROP INDEX "cart_item_product_id_idx";--> statement-breakpoint
DROP INDEX "order_item_product_id_idx";--> statement-breakpoint
ALTER TABLE "cart_item" ALTER COLUMN "variant_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "cart_item_variant_id_idx" ON "cart_item" USING btree ("variant_id");--> statement-breakpoint
ALTER TABLE "cart_item" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "order_item" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "price_cents";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "stock";--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_variant_id_unique" UNIQUE("cart_id","variant_id");