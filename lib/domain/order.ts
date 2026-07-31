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

export function hasSufficientStock(stock: number, quantity: number): boolean {
  if (!Number.isFinite(stock) || !Number.isFinite(quantity)) {
    return false;
  }

  return quantity > 0 && stock >= quantity;
}

export function countCartItems(items: { quantity: number }[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Formats a minor-unit amount. `minorUnits` defaults to 2 (fils/cents); pass
 * the currency row's value when settling a non-decimal currency.
 */
export function formatPrice(
  cents: number,
  currency: string,
  locale: string,
  minorUnits = 2,
): string {
  const divisor = 10 ** minorUnits;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(cents / divisor);
}
