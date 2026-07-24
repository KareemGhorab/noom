import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCartWithItems } from "@/features/cart/queries";
import {
  getLocalizedProductTitle,
} from "@/features/catalog/queries";
import { formatPrice, calculateOrderTotal } from "@/lib/domain/order";
import { CartItemControls } from "@/components/cart/cart-item-controls";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Cart");
  const common = await getTranslations("Common");
  const { items } = await getCartWithItems();

  const totalCents = calculateOrderTotal(
    items.map((item) => ({
      priceCents: item.product.priceCents,
      quantity: item.quantity,
    })),
  );

  if (items.length === 0) {
    return (
      <div className="doodle-radius-card border bg-card p-8 text-center">
        <h1 className="font-display text-3xl font-bold">{t("emptyTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("emptyBody")}</p>
        <Link href="/" className={cn(buttonVariants(), "mt-6")}>
          {common("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <Badge variant="outline">{t("itemCount", { count: items.length })}</Badge>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="doodle-radius-card flex flex-col gap-4 border bg-card p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold">
                {getLocalizedProductTitle(item.product, locale)}
              </h2>
              <p className="text-muted-foreground">
                {formatPrice(
                  item.product.priceCents,
                  item.product.currency,
                  locale,
                )}
              </p>
            </div>
            <CartItemControls
              productId={item.productId}
              quantity={item.quantity}
              maxQuantity={Math.min(item.product.stock, 99)}
            />
          </div>
        ))}
      </div>

      <div className="doodle-radius-card flex flex-col gap-4 border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{common("subtotal")}</p>
          <p className="text-2xl font-bold">
            {formatPrice(totalCents, items[0]?.product.currency ?? "AED", locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}
          >
            {common("continueShopping")}
          </Link>
          <Link href="/checkout" className={buttonVariants()}>
            {common("checkout")}
          </Link>
        </div>
      </div>
    </div>
  );
}
