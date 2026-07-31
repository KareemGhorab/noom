/**
 * Currency codes the app knows how to format and settle in. The `currency`
 * table is the DB source of truth for seeded rows; this list gates anything
 * that reaches us from cookies or form posts the same way `resolveLocale`
 * gates route params against `routing.locales`.
 */
export const CURRENCY_CODES = ["AED", "USD"] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "AED";

const supported: readonly string[] = CURRENCY_CODES;

const minorUnitsByCode: Record<CurrencyCode, number> = {
  AED: 2,
  USD: 2,
};

/**
 * Currency values that reach us from cookies or form posts are attacker
 * controlled. Interpolating an unchecked code into queries or Intl is unsafe,
 * so every value is matched against the supported table before use.
 */
export function resolveCurrency(input: unknown): CurrencyCode {
  if (typeof input !== "string") {
    return DEFAULT_CURRENCY;
  }

  return supported.includes(input)
    ? (input as CurrencyCode)
    : DEFAULT_CURRENCY;
}

export function currencyMinorUnits(code: CurrencyCode): number {
  return minorUnitsByCode[code];
}
