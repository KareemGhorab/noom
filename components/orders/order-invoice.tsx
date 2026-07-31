import { PrintInvoiceButton } from "@/components/orders/print-invoice-button";
import { getLocalizedProductTitle } from "@/features/catalog/queries";
import { formatPrice } from "@/lib/domain/order";
import { getTranslations } from "next-intl/server";

type InvoiceItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  optionSummaryEn: string | null;
  optionSummaryAr: string | null;
  quantity: number;
  priceCents: number;
};

type InvoiceOrder = {
  id: string;
  status: string;
  customerName: string;
  addressLine: string;
  city: string;
  phone: string;
  totalCents: number;
  currency: string;
  discountCode?: string | null;
  discountCents?: number | null;
  createdAt: Date;
  items: InvoiceItem[];
};

export async function OrderInvoice({
  order,
  locale,
}: {
  order: InvoiceOrder;
  locale: string;
}) {
  const t = await getTranslations("Invoice");
  const orders = await getTranslations("Orders");
  const common = await getTranslations("Common");
  const checkout = await getTranslations("Checkout");

  const placedOn = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(order.createdAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:block">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {order.id}
          </p>
        </div>
        <PrintInvoiceButton />
      </div>

      <div className="space-y-2 border-b pb-4">
        <p>
          <span className="text-muted-foreground">{t("placedOn")}: </span>
          {placedOn}
        </p>
        <p>
          <span className="text-muted-foreground">{orders("statusLabel")}: </span>
          {orders(`status.${order.status}`)}
        </p>
        <p>
          <span className="text-muted-foreground">{t("shipTo")}: </span>
          {order.customerName}, {order.addressLine}, {order.city}
        </p>
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          {order.phone}
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start">
            <th className="py-2 font-medium">{t("item")}</th>
            <th className="py-2 font-medium">{common("quantity")}</th>
            <th className="py-2 text-end font-medium">{t("lineTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => {
            const optionSummary =
              locale === "ar" ? item.optionSummaryAr : item.optionSummaryEn;

            return (
              <tr key={item.id} className="border-b align-top">
                <td className="py-3 pe-4">
                  <p className="font-medium">
                    {getLocalizedProductTitle(item, locale)}
                  </p>
                  {optionSummary ? (
                    <p className="text-muted-foreground">{optionSummary}</p>
                  ) : null}
                </td>
                <td className="py-3 pe-4">{item.quantity}</td>
                <td className="py-3 text-end">
                  {formatPrice(
                    item.priceCents * item.quantity,
                    order.currency,
                    locale,
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {order.discountCents != null && order.discountCents > 0 ? (
        <p className="text-end text-muted-foreground">
          {checkout("discount")}
          {order.discountCode ? ` (${order.discountCode})` : ""}: −
          {formatPrice(order.discountCents, order.currency, locale)}
        </p>
      ) : null}

      <p className="text-end text-xl font-bold">
        <span className="text-muted-foreground">{common("total")}: </span>
        {formatPrice(order.totalCents, order.currency, locale)}
      </p>
    </div>
  );
}
