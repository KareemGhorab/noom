import { describe, expect, it } from "vitest";
import {
  computeDiscountAmount,
  normalizeDiscountCode,
  type DiscountInput,
} from "./discount";

const base: DiscountInput = {
  type: "percent",
  valueCents: null,
  percentInt: 10,
  minSubtotalCents: null,
  expiresAt: null,
  usageCap: null,
  usageCount: 0,
  currency: null,
  active: true,
};

describe("normalizeDiscountCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeDiscountCode("  noom10 ")).toBe("NOOM10");
  });
});

describe("computeDiscountAmount", () => {
  it("applies a percent discount floored to cents", () => {
    const result = computeDiscountAmount(base, 14900, "AED");
    expect(result).toEqual({ ok: true, discountCents: 1490 });
  });

  it("caps percent discount at the subtotal", () => {
    const result = computeDiscountAmount(
      { ...base, percentInt: 100 },
      500,
      "AED",
    );
    expect(result).toEqual({ ok: true, discountCents: 500 });
  });

  it("applies a fixed discount in the matching currency", () => {
    const result = computeDiscountAmount(
      {
        ...base,
        type: "fixed",
        percentInt: null,
        valueCents: 2000,
        currency: "AED",
      },
      10000,
      "AED",
    );
    expect(result).toEqual({ ok: true, discountCents: 2000 });
  });

  it("rejects fixed codes for the wrong currency", () => {
    const result = computeDiscountAmount(
      {
        ...base,
        type: "fixed",
        percentInt: null,
        valueCents: 2000,
        currency: "AED",
      },
      10000,
      "USD",
    );
    expect(result).toEqual({ ok: false, code: "invalidDiscount" });
  });

  it("rejects inactive codes", () => {
    expect(
      computeDiscountAmount({ ...base, active: false }, 1000, "AED"),
    ).toEqual({ ok: false, code: "invalidDiscount" });
  });

  it("rejects exhausted usage caps", () => {
    expect(
      computeDiscountAmount(
        { ...base, usageCap: 5, usageCount: 5 },
        1000,
        "AED",
      ),
    ).toEqual({ ok: false, code: "invalidDiscount" });
  });

  it("rejects expired codes", () => {
    const result = computeDiscountAmount(
      { ...base, expiresAt: new Date("2020-01-01T00:00:00Z") },
      1000,
      "AED",
      new Date("2026-07-31T00:00:00Z"),
    );
    expect(result).toEqual({ ok: false, code: "discountExpired" });
  });

  it("rejects when the subtotal is below the minimum", () => {
    const result = computeDiscountAmount(
      { ...base, minSubtotalCents: 5000 },
      1000,
      "AED",
    );
    expect(result).toEqual({ ok: false, code: "discountMinNotMet" });
  });
});
