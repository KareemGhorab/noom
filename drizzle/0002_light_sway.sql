CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "product_title_en_trgm_idx" ON "product" USING gin ("title_en" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "product_title_ar_trgm_idx" ON "product" USING gin ("title_ar" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "product_description_en_trgm_idx" ON "product" USING gin ("description_en" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "product_description_ar_trgm_idx" ON "product" USING gin ("description_ar" gin_trgm_ops);