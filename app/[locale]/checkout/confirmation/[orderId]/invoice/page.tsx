import { OrderInvoice } from "@/components/orders/order-invoice";
import { buttonVariants } from "@/components/ui/button-variants";
import { getOrderForConfirmation } from "@/features/orders/queries";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function ConfirmationInvoicePage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  const sessionUser = await getSessionUser();
  const order = await getOrderForConfirmation(orderId, sessionUser?.id ?? null);
  if (!order) {
    notFound();
  }

  const t = await getTranslations("Invoice");

  return (
    <div className="space-y-6">
      <Link
        href={`/checkout/confirmation/${order.id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "print:hidden",
        )}
      >
        {t("backToConfirmation")}
      </Link>
      <OrderInvoice order={order} locale={locale} />
    </div>
  );
}
