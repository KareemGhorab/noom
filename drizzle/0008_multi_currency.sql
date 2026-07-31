CREATE TABLE "currency" (
	"code" text PRIMARY KEY NOT NULL,
	"minor_units" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO "currency" ("code", "minor_units", "is_default") VALUES ('AED', 2, true), ('USD', 2, false);
--> statement-breakpoint
CREATE TABLE "variant_price" (
	"variant_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"price_cents" integer NOT NULL,
	CONSTRAINT "variant_price_variant_id_currency_pk" PRIMARY KEY("variant_id","currency")
);
--> statement-breakpoint
ALTER TABLE "variant_price" ADD CONSTRAINT "variant_price_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_price" ADD CONSTRAINT "variant_price_currency_currency_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currency"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "variant_price_currency_idx" ON "variant_price" USING btree ("currency");--> statement-breakpoint
-- Existing variants hold AED amounts; copy them, then a rough USD table (~0.27×).
INSERT INTO "variant_price" ("variant_id", "currency", "price_cents")
SELECT "id", 'AED', "price_cents" FROM "product_variant";
--> statement-breakpoint
INSERT INTO "variant_price" ("variant_id", "currency", "price_cents")
SELECT "id", 'USD', greatest(1, round("price_cents" * 0.27)::integer) FROM "product_variant";
--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "currency" text DEFAULT 'AED' NOT NULL;--> statement-breakpoint
UPDATE "order_item" AS oi
SET "currency" = o."currency"
FROM "order" AS o
WHERE o."id" = oi."order_id";
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_currency_currency_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currency"("code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "currency";
