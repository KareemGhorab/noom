import { OrderInvoice } from "@/components/orders/order-invoice";
import { buttonVariants } from "@/components/ui/button-variants";
import { getOrderForUser } from "@/features/orders/queries";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function AccountOrderInvoicePage({
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

  const t = await getTranslations("Invoice");

  return (
    <div className="space-y-6">
      <Link
        href={`/account/orders/${order.id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "print:hidden",
        )}
      >
        {t("backToOrder")}
      </Link>
      <OrderInvoice order={order} locale={locale} />
    </div>
  );
}
