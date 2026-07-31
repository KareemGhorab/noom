import {
  calculateOrderTotal,
  countCartItems,
  formatPrice,
  hasSufficientStock,
} from "@/lib/domain/order";
import { describe, expect, it } from "vitest";

describe("calculateOrderTotal", () => {
  it("sums line totals in cents", () => {
    const total = calculateOrderTotal([
      { priceCents: 2500, quantity: 2 },
      { priceCents: 990, quantity: 1 },
    ]);

    expect(total).toBe(5990);
  });

  it("returns zero for empty carts", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});

describe("hasSufficientStock", () => {
  it("allows a quantity within stock", () => {
    expect(hasSufficientStock(5, 5)).toBe(true);
    expect(hasSufficientStock(5, 1)).toBe(true);
  });

  it("rejects an oversell", () => {
    expect(hasSufficientStock(2, 3)).toBe(false);
    expect(hasSufficientStock(0, 1)).toBe(false);
  });

  it("rejects non-positive and unusable quantities", () => {
    expect(hasSufficientStock(5, 0)).toBe(false);
    expect(hasSufficientStock(5, -1)).toBe(false);
    expect(hasSufficientStock(Number.NaN, 1)).toBe(false);
  });
});

describe("countCartItems", () => {
  it("sums quantities rather than counting lines", () => {
    expect(countCartItems([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });

  it("returns zero for an empty cart", () => {
    expect(countCartItems([])).toBe(0);
  });
});

describe("formatPrice", () => {
  // Intl separates the currency code with a non-breaking space and wraps the
  // Arabic form in directional marks, so expectations use escapes rather than
  // pasted output that only looks right.
  it("formats AED prices for the English locale", () => {
    expect(formatPrice(1999, "AED", "en")).toBe("AED\u00a019.99");
  });

  it("formats AED prices for the Arabic locale with its own symbol", () => {
    expect(formatPrice(1999, "AED", "ar")).toBe(
      "\u200f19.99\u00a0\u062f.\u0625.\u200f",
    );
  });

  it("keeps two fraction digits for whole amounts", () => {
    expect(formatPrice(2000, "AED", "en")).toBe("AED\u00a020.00");
  });

  it("uses the requested currency rather than a default", () => {
    expect(formatPrice(1999, "USD", "en")).toBe("$19.99");
  });

  it("honours an explicit minorUnits override", () => {
    expect(formatPrice(50, "AED", "en", 0)).toBe("AED\u00a050");
  });
});
