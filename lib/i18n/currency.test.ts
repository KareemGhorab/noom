import {
  currencyMinorUnits,
  DEFAULT_CURRENCY,
  resolveCurrency,
} from "@/lib/i18n/currency";
import { describe, expect, it } from "vitest";

describe("resolveCurrency", () => {
  it("accepts supported currencies", () => {
    expect(resolveCurrency("AED")).toBe("AED");
    expect(resolveCurrency("USD")).toBe("USD");
  });

  it("falls back to the default currency for unsupported input", () => {
    expect(resolveCurrency("EUR")).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency("aed")).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency("")).toBe(DEFAULT_CURRENCY);
  });

  it("rejects redirect payloads disguised as currencies", () => {
    expect(resolveCurrency("/evil.com")).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency("//evil.com")).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency("../")).toBe(DEFAULT_CURRENCY);
  });

  it("falls back for non-string input", () => {
    expect(resolveCurrency(undefined)).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency(null)).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency(["USD"])).toBe(DEFAULT_CURRENCY);
  });
});

describe("currencyMinorUnits", () => {
  it("returns two for both seeded currencies", () => {
    expect(currencyMinorUnits("AED")).toBe(2);
    expect(currencyMinorUnits("USD")).toBe(2);
  });
});
