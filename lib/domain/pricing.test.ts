import { aedCentsToUsdCents, priceInCurrency } from "@/lib/domain/pricing";
import { describe, expect, it } from "vitest";

describe("priceInCurrency", () => {
  const prices = [
    { currency: "AED", priceCents: 4500 },
    { currency: "USD", priceCents: 1215 },
  ];

  it("returns the matching currency amount", () => {
    expect(priceInCurrency(prices, "AED")).toBe(4500);
    expect(priceInCurrency(prices, "USD")).toBe(1215);
  });

  it("returns null when the currency is missing", () => {
    expect(priceInCurrency(prices, "EUR")).toBeNull();
    expect(priceInCurrency([], "AED")).toBeNull();
  });
});

describe("aedCentsToUsdCents", () => {
  it("scales and keeps a positive integer", () => {
    expect(aedCentsToUsdCents(10000)).toBe(2700);
    expect(aedCentsToUsdCents(1)).toBe(1);
  });
});
