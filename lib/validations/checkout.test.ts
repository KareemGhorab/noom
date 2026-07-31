import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validations/checkout";

describe("checkoutSchema", () => {
  it("accepts valid checkout data", () => {
    const result = checkoutSchema.parse({
      name: "Noom Shopper",
      phone: "+971501234567",
      addressLine: "123 Marina Walk",
      city: "Dubai",
    });

    expect(result.name).toBe("Noom Shopper");
    expect(result.city).toBe("Dubai");
  });

  it("trims whitespace from fields", () => {
    const result = checkoutSchema.parse({
      name: "  Noom Shopper  ",
      phone: " 501234567 ",
      addressLine: " 123 Marina Walk ",
      city: " Dubai ",
    });

    expect(result.name).toBe("Noom Shopper");
    expect(result.city).toBe("Dubai");
  });

  it("rejects invalid phone numbers", () => {
    expect(() =>
      checkoutSchema.parse({
        name: "Noom Shopper",
        phone: "abc",
        addressLine: "123 Marina Walk",
        city: "Dubai",
      }),
    ).toThrow();
  });

  it("rejects short names and addresses", () => {
    expect(() =>
      checkoutSchema.parse({
        name: "A",
        phone: "+971501234567",
        addressLine: "123",
        city: "Dubai",
      }),
    ).toThrow();
  });

  it("normalizes an optional discount code", () => {
    const result = checkoutSchema.parse({
      name: "Noom Shopper",
      phone: "+971501234567",
      addressLine: "123 Marina Walk",
      city: "Dubai",
      discountCode: "  noom10 ",
    });

    expect(result.discountCode).toBe("NOOM10");
  });

  it("treats a blank discount code as absent", () => {
    const result = checkoutSchema.parse({
      name: "Noom Shopper",
      phone: "+971501234567",
      addressLine: "123 Marina Walk",
      city: "Dubai",
      discountCode: "   ",
    });

    expect(result.discountCode).toBeUndefined();
  });
});
