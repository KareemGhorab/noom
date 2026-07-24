import { describe, expect, it } from "vitest";
import { calculateOrderTotal, formatPrice } from "@/lib/domain/order";

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

describe("formatPrice", () => {
  it("formats AED prices for English locale", () => {
    const formatted = formatPrice(1999, "AED", "en");
    expect(formatted).toContain("19.99");
  });
});
