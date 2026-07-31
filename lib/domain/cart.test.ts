import { describe, expect, it } from "vitest";
import {
    MAX_CART_ITEM_QUANTITY,
    cartQuantityCap,
    clampCartQuantity,
} from "./cart";

describe("cartQuantityCap", () => {
  it("is bounded by available stock", () => {
    expect(cartQuantityCap(5)).toBe(5);
  });

  it("is bounded by the per-line maximum", () => {
    expect(cartQuantityCap(500)).toBe(MAX_CART_ITEM_QUANTITY);
  });

  it("never goes negative", () => {
    expect(cartQuantityCap(-3)).toBe(0);
  });
});

describe("clampCartQuantity", () => {
  it("keeps a quantity that fits", () => {
    expect(clampCartQuantity(3, 10)).toBe(3);
  });

  it("clamps to stock", () => {
    expect(clampCartQuantity(12, 4)).toBe(4);
  });

  it("clamps to the per-line maximum", () => {
    expect(clampCartQuantity(250, 500)).toBe(MAX_CART_ITEM_QUANTITY);
  });

  it("returns zero for non-positive or unusable input", () => {
    expect(clampCartQuantity(0, 10)).toBe(0);
    expect(clampCartQuantity(-2, 10)).toBe(0);
    expect(clampCartQuantity(Number.NaN, 10)).toBe(0);
  });

  it("returns zero when the product is out of stock", () => {
    expect(clampCartQuantity(3, 0)).toBe(0);
  });

  it("floors fractional quantities", () => {
    expect(clampCartQuantity(2.7, 10)).toBe(2);
  });
});
