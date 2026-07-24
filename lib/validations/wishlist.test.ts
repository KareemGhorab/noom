import { describe, expect, it } from "vitest";
import { wishlistToggleSchema } from "./wishlist";

describe("wishlistToggleSchema", () => {
  it("accepts a uuid product id", () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    expect(wishlistToggleSchema.parse({ productId })).toEqual({ productId });
  });

  it("rejects non-uuid product ids", () => {
    expect(
      wishlistToggleSchema.safeParse({ productId: "not-a-uuid" }).success,
    ).toBe(false);
  });
});
