export const LOW_STOCK_THRESHOLD = 5;

export type StockState = "out" | "low" | "in";

export function getStockState(stock: number): StockState {
  if (stock <= 0) {
    return "out";
  }

  return stock <= LOW_STOCK_THRESHOLD ? "low" : "in";
}

export type VariantSummaryInput = {
  /** Null when the variant has no price in the active currency. */
  priceCents: number | null;
  stock: number;
};

export type VariantSummary = {
  minPriceCents: number;
  maxPriceCents: number;
  totalStock: number;
  hasPrice: boolean;
};

/**
 * Catalog cards and filters treat a product as the envelope of its variants:
 * cheapest / dearest priced SKU (in the active currency) and pooled stock.
 * Variants without a price in that currency are skipped for the envelope.
 */
export function summarizeVariants(
  variants: readonly VariantSummaryInput[],
): VariantSummary {
  if (variants.length === 0) {
    return {
      minPriceCents: 0,
      maxPriceCents: 0,
      totalStock: 0,
      hasPrice: false,
    };
  }

  let minPriceCents = Number.POSITIVE_INFINITY;
  let maxPriceCents = Number.NEGATIVE_INFINITY;
  let totalStock = 0;
  let hasPrice = false;

  for (const variant of variants) {
    if (variant.priceCents != null) {
      hasPrice = true;
      minPriceCents = Math.min(minPriceCents, variant.priceCents);
      maxPriceCents = Math.max(maxPriceCents, variant.priceCents);
    }
    totalStock += variant.stock;
  }

  if (!hasPrice) {
    return { minPriceCents: 0, maxPriceCents: 0, totalStock, hasPrice };
  }

  return { minPriceCents, maxPriceCents, totalStock, hasPrice };
}

export type OptionLabel = {
  key: string;
  labelEn: string;
  labelAr: string;
  position: number;
};

/**
 * Builds a stable "Size: M / Color: Blue" line for cart and order snapshots.
 * Options without a selected value are skipped; order follows `position`.
 */
export function formatOptionSummary(
  options: readonly OptionLabel[],
  optionValues: Record<string, string>,
  locale: string,
): string {
  const parts: string[] = [];

  for (const option of [...options].sort((a, b) => a.position - b.position)) {
    const value = optionValues[option.key];
    if (!value) {
      continue;
    }

    const label = locale === "ar" ? option.labelAr : option.labelEn;
    parts.push(`${label}: ${value}`);
  }

  return parts.join(" / ");
}

export function buildPageList(
  page: number,
  pageCount: number,
  window = 2,
): number[] {
  if (pageCount <= 0) {
    return [];
  }

  const start = Math.max(1, Math.min(page - window, pageCount - window * 2));
  const end = Math.min(pageCount, Math.max(page + window, window * 2 + 1));

  const pages: number[] = [];
  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  return pages;
}
