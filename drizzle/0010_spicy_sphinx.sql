CREATE TYPE "public"."discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TABLE "discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "discount_type" NOT NULL,
	"value_cents" integer,
	"percent_int" integer,
	"min_subtotal_cents" integer,
	"expires_at" timestamp,
	"usage_cap" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"currency" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_code_unique" UNIQUE("code"),
	CONSTRAINT "discount_percent_or_fixed" CHECK (("discount"."type" = 'percent' and "discount"."percent_int" is not null and "discount"."percent_int" > 0 and "discount"."percent_int" <= 100)
          or ("discount"."type" = 'fixed' and "discount"."value_cents" is not null and "discount"."value_cents" > 0)),
	CONSTRAINT "discount_usage_non_negative" CHECK ("discount"."usage_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"variant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notified_at" timestamp,
	CONSTRAINT "stock_subscription_email_variant_id_unique" UNIQUE("email","variant_id")
);
--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_cents" integer;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_currency_currency_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currency"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_subscription" ADD CONSTRAINT "stock_subscription_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_subscription_variant_id_idx" ON "stock_subscription" USING btree ("variant_id");