import { describe, expect, it } from "vitest";
import { profileUpdateSchema } from "./profile";

describe("profileUpdateSchema", () => {
  it("accepts a valid name", () => {
    expect(profileUpdateSchema.parse({ name: "Demo Shopper" })).toEqual({
      name: "Demo Shopper",
    });
  });

  it("trims whitespace", () => {
    expect(profileUpdateSchema.parse({ name: "  Ada  " }).name).toBe("Ada");
  });

  it("rejects names that are too short", () => {
    expect(profileUpdateSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects empty names", () => {
    expect(profileUpdateSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepts a name at the 100 character limit", () => {
    const name = "a".repeat(100);
    expect(profileUpdateSchema.parse({ name }).name).toBe(name);
  });

  it("rejects a name past the 100 character limit", () => {
    expect(
      profileUpdateSchema.safeParse({ name: "a".repeat(101) }).success,
    ).toBe(false);
  });

  it("measures length after trimming", () => {
    expect(
      profileUpdateSchema.safeParse({ name: `  ${"a".repeat(100)}  ` }).success,
    ).toBe(true);
  });
});
