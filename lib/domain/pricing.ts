/**
 * Resolve a variant's shopper-facing price for the active currency.
 * Missing rows mean the SKU is unpurchasable in that currency — not a
 * zero-price product (see ADR 0013).
 */
export function priceInCurrency(
  prices: readonly { currency: string; priceCents: number }[],
  currency: string,
): number | null {
  const match = prices.find((price) => price.currency === currency);
  return match ? match.priceCents : null;
}

/** Rough USD table used by seed (~0.27× AED). Kept integer for minor units. */
export function aedCentsToUsdCents(aedCents: number): number {
  return Math.max(1, Math.round(aedCents * 0.27));
}
