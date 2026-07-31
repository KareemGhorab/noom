ALTER TABLE "cart_item" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "option_summary_en" text;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "option_summary_ar" text;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_item_variant_id_idx" ON "order_item" USING btree ("variant_id");