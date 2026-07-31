import { describe, expect, it } from "vitest";
import { addressCreateSchema, addressUpdateSchema } from "./address";

const valid = {
  label: "Home",
  fullName: "Demo Shopper",
  phone: "+971501234567",
  addressLine: "Demo Marina Walk",
  city: "Dubai",
};

describe("addressCreateSchema", () => {
  it("accepts a complete address and defaults isDefault to false", () => {
    const parsed = addressCreateSchema.parse(valid);
    expect(parsed.isDefault).toBe(false);
    expect(parsed.city).toBe("Dubai");
  });

  it("trims surrounding whitespace", () => {
    const parsed = addressCreateSchema.parse({
      ...valid,
      label: "  Home  ",
      city: "  Dubai  ",
    });
    expect(parsed.label).toBe("Home");
    expect(parsed.city).toBe("Dubai");
  });

  it("rejects a short label", () => {
    expect(addressCreateSchema.safeParse({ ...valid, label: "H" }).success).toBe(
      false,
    );
  });

  it("rejects a label over 40 characters", () => {
    expect(
      addressCreateSchema.safeParse({ ...valid, label: "a".repeat(41) }).success,
    ).toBe(false);
  });

  it("applies the shared checkout field rules", () => {
    expect(
      addressCreateSchema.safeParse({ ...valid, phone: "letters-only" }).success,
    ).toBe(false);
    expect(
      addressCreateSchema.safeParse({ ...valid, addressLine: "abc" }).success,
    ).toBe(false);
    expect(addressCreateSchema.safeParse({ ...valid, city: "D" }).success).toBe(
      false,
    );
  });
});

describe("addressUpdateSchema", () => {
  it("requires a uuid id", () => {
    expect(
      addressUpdateSchema.safeParse({ ...valid, id: "nope" }).success,
    ).toBe(false);

    expect(
      addressUpdateSchema.safeParse({
        ...valid,
        id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      }).success,
    ).toBe(true);
  });
});
