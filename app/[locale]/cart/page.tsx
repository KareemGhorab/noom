import { CartItemControls } from "@/components/cart/cart-item-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { getCartWithItems } from "@/features/cart/queries";
import { getLocalizedProductTitle } from "@/features/catalog/queries";
import { Link } from "@/i18n/navigation";
import { formatOptionSummary } from "@/lib/domain/catalog";
import {
  calculateOrderTotal,
  countCartItems,
  formatPrice,
} from "@/lib/domain/order";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("cartTitle"), description: t("cartDescription") };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Cart");
  const common = await getTranslations("Common");
  const errors = await getTranslations("Errors");
  const { items, currency } = await getCartWithItems();

  const pricedItems = items.filter(
    (item) => item.variant.priceCents != null,
  );
  const hasUnpriced = pricedItems.length !== items.length;

  const totalCents = calculateOrderTotal(
    pricedItems.map((item) => ({
      priceCents: item.variant.priceCents!,
      quantity: item.quantity,
    })),
  );

  if (items.length === 0) {
    const lookup = await getTranslations("OrderLookup");

    return (
      <div className="doodle-radius-card border bg-card p-8 text-center">
        <h1 className="font-display text-3xl font-bold">{t("emptyTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("emptyBody")}</p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={cn(buttonVariants())}>
            {common("continueShopping")}
          </Link>
          <Link
            href="/orders/lookup"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {lookup("link")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <Badge variant="outline">
          {t("itemCount", { count: countCartItems(items) })}
        </Badge>
      </div>

      {hasUnpriced ? (
        <p className="text-sm text-destructive">{errors("priceUnavailable")}</p>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => {
          const optionSummary = formatOptionSummary(
            item.variant.product.options,
            item.variant.optionValues,
            locale,
          );
          const linePrice = item.variant.priceCents;

          return (
            <div
              key={item.id}
              className="doodle-radius-card flex flex-col gap-4 border bg-card p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {getLocalizedProductTitle(item.variant.product, locale)}
                </h2>
                {optionSummary ? (
                  <p className="text-sm text-muted-foreground">{optionSummary}</p>
                ) : null}
                <p className="text-muted-foreground">
                  {linePrice == null
                    ? errors("priceUnavailable")
                    : formatPrice(linePrice, currency, locale)}
                </p>
              </div>
              <CartItemControls
                variantId={item.variantId}
                quantity={item.quantity}
                maxQuantity={Math.min(item.variant.stock, 99)}
              />
            </div>
          );
        })}
      </div>

      <div className="doodle-radius-card flex flex-col gap-4 border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{common("subtotal")}</p>
          <p className="text-2xl font-bold">
            {hasUnpriced
              ? errors("priceUnavailable")
              : formatPrice(totalCents, currency, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}
          >
            {common("continueShopping")}
          </Link>
          {!hasUnpriced ? (
            <Link href="/checkout" className={buttonVariants()}>
              {common("checkout")}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
