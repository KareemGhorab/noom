import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCartWithItems } from "@/features/cart/queries";
import { calculateOrderTotal, formatPrice } from "@/lib/domain/order";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Badge } from "@/components/ui/badge";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Checkout");
  const common = await getTranslations("Common");
  const { items } = await getCartWithItems();

  if (items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  const totalCents = calculateOrderTotal(
    items.map((item) => ({
      priceCents: item.product.priceCents,
      quantity: item.quantity,
    })),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <Badge>{common("demoCheckoutBanner")}</Badge>
        </div>
        <CheckoutForm locale={locale} />
      </div>
      <aside className="doodle-radius-card h-fit space-y-3 border bg-card p-6">
        <p className="text-sm text-muted-foreground">{common("total")}</p>
        <p className="text-3xl font-bold">
          {formatPrice(totalCents, items[0]?.product.currency ?? "AED", locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {items.length} items · {common("demoCheckoutBanner")}
        </p>
      </aside>
    </div>
  );
}
