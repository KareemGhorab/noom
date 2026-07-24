import { describe, expect, it } from "vitest";
import {
  buildSearchTerms,
  normalizeSearchQuery,
} from "@/lib/validations/search";

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
});
