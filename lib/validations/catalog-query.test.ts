import { describe, expect, it } from "vitest";
import {
    DEFAULT_PER_PAGE,
    MAX_PER_PAGE,
    parseCatalogQuery,
} from "./catalog-query";

describe("parseCatalogQuery", () => {
  it("applies defaults for an empty query string", () => {
    const parsed = parseCatalogQuery({});

    expect(parsed).toMatchObject({
      q: "",
      sort: "newest",
      page: 1,
      perPage: DEFAULT_PER_PAGE,
    });
    expect(parsed.category).toBeUndefined();
    expect(parsed.minPrice).toBeUndefined();
  });

  it("keeps both a query and a category so neither overrides the other", () => {
    const parsed = parseCatalogQuery({ q: "lamp", category: "home" });

    expect(parsed.q).toBe("lamp");
    expect(parsed.category).toBe("home");
  });

  it("falls back to the default sort for an unknown value", () => {
    expect(parseCatalogQuery({ sort: "cheapest" }).sort).toBe("newest");
    expect(parseCatalogQuery({ sort: "priceAsc" }).sort).toBe("priceAsc");
  });

  it("clamps pagination", () => {
    expect(parseCatalogQuery({ page: "0" }).page).toBe(1);
    expect(parseCatalogQuery({ page: "-4" }).page).toBe(1);
    expect(parseCatalogQuery({ page: "abc" }).page).toBe(1);
    expect(parseCatalogQuery({ perPage: "9999" }).perPage).toBe(MAX_PER_PAGE);
    expect(parseCatalogQuery({ perPage: String(MAX_PER_PAGE) }).perPage).toBe(
      MAX_PER_PAGE,
    );
    expect(parseCatalogQuery({ perPage: "abc" }).perPage).toBe(
      DEFAULT_PER_PAGE,
    );
  });

  it("parses a price range", () => {
    const parsed = parseCatalogQuery({ minPrice: "10", maxPrice: "50" });
    expect(parsed.minPrice).toBe(10);
    expect(parsed.maxPrice).toBe(50);
  });

  it("swaps a reversed price range", () => {
    const parsed = parseCatalogQuery({ minPrice: "80", maxPrice: "20" });
    expect(parsed.minPrice).toBe(20);
    expect(parsed.maxPrice).toBe(80);
  });

  it("drops unusable price input", () => {
    const parsed = parseCatalogQuery({ minPrice: "abc", maxPrice: "" });
    expect(parsed.minPrice).toBeUndefined();
    expect(parsed.maxPrice).toBeUndefined();
  });

  it("normalizes the search term", () => {
    expect(parseCatalogQuery({ q: "  wireless   earbuds " }).q).toBe(
      "wireless earbuds",
    );
  });

  it("rejects an overlong query down to empty", () => {
    expect(parseCatalogQuery({ q: "a".repeat(101) }).q).toBe("");
  });
});
