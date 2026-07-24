import { describe, expect, it } from "vitest";
import { canViewOrder } from "./orders-access";

describe("canViewOrder", () => {
  it("allows the owning user", () => {
    expect(
      canViewOrder({ orderUserId: "user-1", viewerUserId: "user-1" }),
    ).toBe(true);
  });

  it("denies other users", () => {
    expect(
      canViewOrder({ orderUserId: "user-1", viewerUserId: "user-2" }),
    ).toBe(false);
  });

  it("denies guests and orphan orders", () => {
    expect(
      canViewOrder({ orderUserId: "user-1", viewerUserId: null }),
    ).toBe(false);
    expect(
      canViewOrder({ orderUserId: null, viewerUserId: "user-1" }),
    ).toBe(false);
  });
});
