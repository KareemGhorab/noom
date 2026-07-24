export type OrderLineItem = {
  priceCents: number;
  quantity: number;
};

export function calculateOrderTotal(items: OrderLineItem[]): number {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
}

export function formatPrice(
  cents: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
