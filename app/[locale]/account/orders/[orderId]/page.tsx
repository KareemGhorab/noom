import { AccountNav } from "@/components/account/account-nav";
import { OrderActions } from "@/components/orders/order-actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { getLocalizedProductTitle } from "@/features/catalog/queries";
import { getOrderForUser } from "@/features/orders/queries";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/domain/order";
import { canCancelOrder } from "@/lib/domain/orders-access";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  const user = await requireSessionUser(locale);
  const order = await getOrderForUser(orderId, user.id);
  if (!order) {
    notFound();
  }

  const t = await getTranslations("Orders");
  const common = await getTranslations("Common");
  const checkout = await getTranslations("Checkout");
  const invoice = await getTranslations("Invoice");

  return (
    <>
      <AccountNav active="orders" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("detailTitle")}
            </h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {order.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/account/orders/${order.id}/invoice`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {invoice("viewInvoice")}
            </Link>
            <Link
              href="/account/orders"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("backToOrders")}
            </Link>
          </div>
        </div>

        <div className="doodle-radius-card space-y-2 border bg-card p-6">
          <p>
            <span className="text-muted-foreground">{t("statusLabel")}: </span>
            {t(`status.${order.status}`)}
          </p>
          {order.cancelledAt ? (
            <p className="text-sm text-muted-foreground">
              {t("cancelledOn", {
                date: new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                }).format(order.cancelledAt),
              })}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">{t("shipTo")}: </span>
            {order.customerName}, {order.addressLine}, {order.city}
          </p>
          {order.discountCents != null && order.discountCents > 0 ? (
            <p>
              <span className="text-muted-foreground">
                {checkout("discount")}
                {order.discountCode ? ` (${order.discountCode})` : ""}:{" "}
              </span>
              −{formatPrice(order.discountCents, order.currency, locale)}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">{common("total")}: </span>
            {formatPrice(order.totalCents, order.currency, locale)}
          </p>
        </div>

        <OrderActions
          orderId={order.id}
          cancellable={canCancelOrder({
            status: order.status,
            orderUserId: order.userId,
            viewerUserId: user.id,
          })}
        />

        <ul className="space-y-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="doodle-radius-card flex items-center gap-4 border bg-card p-4"
            >
              <div className="relative size-16 overflow-hidden doodle-radius-media bg-muted">
                <Image
                  src={item.imageUrl}
                  alt={getLocalizedProductTitle(item, locale)}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {getLocalizedProductTitle(item, locale)}
                </p>
                {(locale === "ar"
                  ? item.optionSummaryAr
                  : item.optionSummaryEn) ? (
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar"
                      ? item.optionSummaryAr
                      : item.optionSummaryEn}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {common("quantity")}: {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                {formatPrice(
                  item.priceCents * item.quantity,
                  order.currency,
                  locale,
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
