import { buttonVariants } from "@/components/ui/button-variants";
import {
    getLocalizedProductTitle,
} from "@/features/catalog/queries";
import { getOrderById } from "@/features/orders/queries";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/domain/order";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  const order = await getOrderById(orderId);
  if (!order) {
    notFound();
  }

  const t = await getTranslations("Confirmation");
  const common = await getTranslations("Common");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="doodle-radius-card border bg-card p-8 text-center">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("thanks")}</p>
        <p className="mt-6 text-sm text-muted-foreground">{t("orderId")}</p>
        <p className="font-mono text-lg">{order.id}</p>
        <p className="mt-4 text-2xl font-bold">
          {formatPrice(order.totalCents, order.currency, locale)}
        </p>
      </div>

      <div className="space-y-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="doodle-radius-card flex items-center justify-between border bg-card p-4"
          >
            <div>
              <p className="font-medium">
                {getLocalizedProductTitle(item, locale)}
              </p>
              <p className="text-sm text-muted-foreground">
                {common("quantity")}: {item.quantity}
              </p>
            </div>
            <p>{formatPrice(item.priceCents * item.quantity, order.currency, locale)}</p>
          </div>
        ))}
      </div>

      <Link href="/" className={cn(buttonVariants(), "w-full")}>
        {common("backHome")}
      </Link>
    </div>
  );
}
