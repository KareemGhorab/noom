import { OrderLookupForm } from "@/components/orders/order-lookup-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function OrderLookupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("OrderLookup");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("body")}</p>
      </div>
      <OrderLookupForm locale={locale} />
    </div>
  );
}
