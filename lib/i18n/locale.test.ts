import { localePath, resolveLocale } from "@/lib/i18n/locale";
import { describe, expect, it } from "vitest";

describe("resolveLocale", () => {
  it("accepts supported locales", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("ar")).toBe("ar");
  });

  it("falls back to the default locale for unsupported input", () => {
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale("EN")).toBe("en");
    expect(resolveLocale("")).toBe("en");
  });

  it("rejects redirect payloads disguised as locales", () => {
    expect(resolveLocale("/evil.com")).toBe("en");
    expect(resolveLocale("//evil.com")).toBe("en");
    expect(resolveLocale("../")).toBe("en");
    expect(resolveLocale("en/../../evil.com")).toBe("en");
  });

  it("falls back for non-string input", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale(null)).toBe("en");
    expect(resolveLocale(["ar"])).toBe("en");
  });
});

describe("localePath", () => {
  it("builds a locale-prefixed path", () => {
    expect(localePath("ar", "/auth/login")).toBe("/ar/auth/login");
    expect(localePath("ar", "auth/login")).toBe("/ar/auth/login");
  });

  it("never emits a protocol-relative path", () => {
    expect(localePath("//evil.com", "/auth/login")).toBe("/en/auth/login");
  });
});
