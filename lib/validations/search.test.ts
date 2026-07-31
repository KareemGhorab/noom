import {
    buildSearchTerms,
    escapeLikePattern,
    isSearchQueryRejected,
    normalizeSearchQuery,
} from "@/lib/validations/search";
import { describe, expect, it } from "vitest";

describe("normalizeSearchQuery", () => {
  it("returns empty string for nullish values", () => {
    expect(normalizeSearchQuery(null)).toBe("");
    expect(normalizeSearchQuery(undefined)).toBe("");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeSearchQuery("  wireless   headphones  ")).toBe(
      "wireless headphones",
    );
  });

  it("rejects queries longer than 100 characters", () => {
    expect(normalizeSearchQuery("a".repeat(101))).toBe("");
  });
});

describe("buildSearchTerms", () => {
  it("splits normalized query into terms", () => {
    expect(buildSearchTerms("  blue   mug  ")).toEqual(["blue", "mug"]);
  });

  it("returns empty array for blank queries", () => {
    expect(buildSearchTerms("   ")).toEqual([]);
  });

  it("escapes ILIKE wildcards so a bare % cannot match everything", () => {
    expect(buildSearchTerms("%")).toEqual(["\\%"]);
    expect(buildSearchTerms("50% off_now")).toEqual(["50\\%", "off\\_now"]);
  });
});

describe("escapeLikePattern", () => {
  it("escapes percent, underscore, and backslash", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });

  it("leaves ordinary terms untouched", () => {
    expect(escapeLikePattern("earbuds")).toBe("earbuds");
  });
});

describe("isSearchQueryRejected", () => {
  it("flags an overlong query so the UI can explain the empty result", () => {
    expect(isSearchQueryRejected("a".repeat(101))).toBe(true);
  });

  it("does not flag an acceptable or absent query", () => {
    expect(isSearchQueryRejected("earbuds")).toBe(false);
    expect(isSearchQueryRejected(undefined)).toBe(false);
  });
});
