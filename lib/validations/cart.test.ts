import { describe, expect, it } from "vitest";
import {
  addToCartSchema,
  cartItemQuantitySchema,
  updateCartItemSchema,
} from "@/lib/validations/cart";

describe("cartItemQuantitySchema", () => {
  it("accepts valid quantities", () => {
    expect(cartItemQuantitySchema.parse(1)).toBe(1);
    expect(cartItemQuantitySchema.parse(99)).toBe(99);
  });

  it("rejects zero and negative quantities", () => {
    expect(() => cartItemQuantitySchema.parse(0)).toThrow();
    expect(() => cartItemQuantitySchema.parse(-1)).toThrow();
  });

  it("rejects quantities above 99", () => {
    expect(() => cartItemQuantitySchema.parse(100)).toThrow();
  });

  it("rejects non-integers", () => {
    expect(() => cartItemQuantitySchema.parse(1.5)).toThrow();
  });
});

describe("addToCartSchema", () => {
  it("defaults quantity to 1", () => {
    const result = addToCartSchema.parse({
      variantId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.quantity).toBe(1);
  });
});

describe("updateCartItemSchema", () => {
  it("requires a valid variant id and quantity", () => {
    const result = updateCartItemSchema.parse({
      variantId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 3,
    });
    expect(result.quantity).toBe(3);
  });
});
