import { describe, expect, it } from "vitest";
import {
    canCancelOrder,
    canViewOrder,
    canViewOrderConfirmation,
} from "./orders-access";

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

describe("canViewOrderConfirmation", () => {
  const orderId = "order-1";

  it("allows the owning user regardless of cookie", () => {
    expect(
      canViewOrderConfirmation({
        orderId,
        orderUserId: "user-1",
        viewerUserId: "user-1",
        cookieOrderId: undefined,
      }),
    ).toBe(true);
  });

  it("allows a guest holding the matching checkout cookie", () => {
    expect(
      canViewOrderConfirmation({
        orderId,
        orderUserId: null,
        viewerUserId: null,
        cookieOrderId: orderId,
      }),
    ).toBe(true);
  });

  it("denies a guest whose cookie points at another order", () => {
    expect(
      canViewOrderConfirmation({
        orderId,
        orderUserId: null,
        viewerUserId: null,
        cookieOrderId: "order-2",
      }),
    ).toBe(false);
  });

  it("denies a signed-in user viewing someone else's order", () => {
    expect(
      canViewOrderConfirmation({
        orderId,
        orderUserId: "user-1",
        viewerUserId: "user-2",
        cookieOrderId: undefined,
      }),
    ).toBe(false);
  });

  it("denies anonymous access with no cookie", () => {
    expect(
      canViewOrderConfirmation({
        orderId,
        orderUserId: "user-1",
        viewerUserId: null,
        cookieOrderId: null,
      }),
    ).toBe(false);
  });

  it("denies an empty cookie value against an empty order id", () => {
    expect(
      canViewOrderConfirmation({
        orderId: "",
        orderUserId: null,
        viewerUserId: null,
        cookieOrderId: "",
      }),
    ).toBe(false);
  });
});

describe("canCancelOrder", () => {
  it("allows the owner to cancel a placed order", () => {
    expect(
      canCancelOrder({
        status: "placed",
        orderUserId: "user-1",
        viewerUserId: "user-1",
      }),
    ).toBe(true);
  });

  it("denies cancelling an already cancelled order", () => {
    expect(
      canCancelOrder({
        status: "cancelled",
        orderUserId: "user-1",
        viewerUserId: "user-1",
      }),
    ).toBe(false);
  });

  it("denies a non-owner", () => {
    expect(
      canCancelOrder({
        status: "placed",
        orderUserId: "user-1",
        viewerUserId: "user-2",
      }),
    ).toBe(false);
  });

  it("denies a guest", () => {
    expect(
      canCancelOrder({
        status: "placed",
        orderUserId: null,
        viewerUserId: null,
      }),
    ).toBe(false);
  });
});
