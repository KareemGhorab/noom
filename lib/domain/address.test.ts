import { describe, expect, it } from "vitest";
import {
    pickDefaultAddress,
    toCheckoutDefaults,
    type AddressLike,
} from "./address";

function address(overrides: Partial<AddressLike> & { id: string }): AddressLike {
  return {
    label: "Home",
    fullName: "Demo Shopper",
    phone: "+971501234567",
    addressLine: "Demo Marina Walk",
    city: "Dubai",
    isDefault: false,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("pickDefaultAddress", () => {
  it("returns null when there are no addresses", () => {
    expect(pickDefaultAddress([])).toBeNull();
  });

  it("prefers the flagged default", () => {
    const picked = pickDefaultAddress([
      address({ id: "a", createdAt: new Date("2026-05-01") }),
      address({ id: "b", isDefault: true, createdAt: new Date("2026-01-01") }),
    ]);

    expect(picked?.id).toBe("b");
  });

  it("falls back to the newest address when none is flagged", () => {
    const picked = pickDefaultAddress([
      address({ id: "a", createdAt: new Date("2026-01-01") }),
      address({ id: "b", createdAt: new Date("2026-05-01") }),
    ]);

    expect(picked?.id).toBe("b");
  });

  it("breaks a multi-default tie with the newest", () => {
    const picked = pickDefaultAddress([
      address({ id: "a", isDefault: true, createdAt: new Date("2026-01-01") }),
      address({ id: "b", isDefault: true, createdAt: new Date("2026-05-01") }),
    ]);

    expect(picked?.id).toBe("b");
  });
});

describe("toCheckoutDefaults", () => {
  it("maps address fields onto the checkout form shape", () => {
    expect(
      toCheckoutDefaults({
        fullName: "Demo Shopper",
        phone: "+971501234567",
        addressLine: "Demo Marina Walk",
        city: "Dubai",
      }),
    ).toEqual({
      name: "Demo Shopper",
      phone: "+971501234567",
      addressLine: "Demo Marina Walk",
      city: "Dubai",
    });
  });
});
