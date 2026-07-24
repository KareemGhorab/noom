import { AccountNav } from "@/components/account/account-nav";
import { buttonVariants } from "@/components/ui/button-variants";
import { listOrdersForUser } from "@/features/orders/queries";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/domain/order";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireSessionUser(locale);
  const orders = await listOrdersForUser(user.id);
  const t = await getTranslations("Orders");
  const common = await getTranslations("Common");

  return (
    <>
      <AccountNav active="orders" />
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        {orders.length === 0 ? (
          <div className="doodle-radius-card border bg-card p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">
              {t("emptyTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
            <Link
              href="/"
              className={cn(buttonVariants(), "mt-6 inline-flex")}
            >
              {common("continueShopping")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="doodle-radius-card flex flex-col gap-2 border bg-card p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {t("orderLabel", { id: order.id.slice(0, 8) })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("placedOn", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(order.createdAt),
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("itemCount", { count: order.items.length })} ·{" "}
                      {t("status", { status: order.status })}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(order.totalCents, order.currency, locale)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
