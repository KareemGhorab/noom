import { describe, expect, it } from "vitest";
import { orderLookupSchema } from "@/lib/validations/order-lookup";

describe("orderLookupSchema", () => {
  it("accepts a normalized email and uuid order id", () => {
    const result = orderLookupSchema.parse({
      email: "  Guest@Noom.app ",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.email).toBe("guest@noom.app");
    expect(result.orderId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects invalid email or order id", () => {
    expect(() =>
      orderLookupSchema.parse({
        email: "not-an-email",
        orderId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toThrow();

    expect(() =>
      orderLookupSchema.parse({
        email: "guest@noom.app",
        orderId: "not-a-uuid",
      }),
    ).toThrow();
  });
});
