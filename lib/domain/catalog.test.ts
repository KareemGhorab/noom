import { describe, expect, it } from "vitest";
import {
  LOW_STOCK_THRESHOLD,
  buildPageList,
  formatOptionSummary,
  getStockState,
  summarizeVariants,
} from "./catalog";

describe("getStockState", () => {
  it("reports out of stock at or below zero", () => {
    expect(getStockState(0)).toBe("out");
    expect(getStockState(-1)).toBe("out");
  });

  it("reports low stock up to the threshold", () => {
    expect(getStockState(1)).toBe("low");
    expect(getStockState(LOW_STOCK_THRESHOLD)).toBe("low");
  });

  it("reports in stock above the threshold", () => {
    expect(getStockState(LOW_STOCK_THRESHOLD + 1)).toBe("in");
  });
});

describe("summarizeVariants", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeVariants([])).toEqual({
      minPriceCents: 0,
      maxPriceCents: 0,
      totalStock: 0,
      hasPrice: false,
    });
  });

  it("aggregates min/max price and total stock", () => {
    expect(
      summarizeVariants([
        { priceCents: 4500, stock: 10 },
        { priceCents: 4900, stock: 3 },
        { priceCents: 4200, stock: 0 },
      ]),
    ).toEqual({
      minPriceCents: 4200,
      maxPriceCents: 4900,
      totalStock: 13,
      hasPrice: true,
    });
  });

  it("skips variants without a price in the active currency", () => {
    expect(
      summarizeVariants([
        { priceCents: null, stock: 5 },
        { priceCents: 1200, stock: 2 },
      ]),
    ).toEqual({
      minPriceCents: 1200,
      maxPriceCents: 1200,
      totalStock: 7,
      hasPrice: true,
    });
  });

  it("reports hasPrice false when nothing is priced", () => {
    expect(
      summarizeVariants([
        { priceCents: null, stock: 5 },
        { priceCents: null, stock: 1 },
      ]),
    ).toEqual({
      minPriceCents: 0,
      maxPriceCents: 0,
      totalStock: 6,
      hasPrice: false,
    });
  });
});

describe("formatOptionSummary", () => {
  const options = [
    { key: "color", labelEn: "Color", labelAr: "اللون", position: 1 },
    { key: "size", labelEn: "Size", labelAr: "المقاس", position: 0 },
  ];

  it("orders by position and localizes labels", () => {
    expect(
      formatOptionSummary(options, { size: "M", color: "Blue" }, "en"),
    ).toBe("Size: M / Color: Blue");
    expect(
      formatOptionSummary(options, { size: "M", color: "Blue" }, "ar"),
    ).toBe("المقاس: M / اللون: Blue");
  });

  it("skips options without a selected value", () => {
    expect(formatOptionSummary(options, { size: "S" }, "en")).toBe("Size: S");
  });

  it("returns an empty string when nothing is selected", () => {
    expect(formatOptionSummary(options, {}, "en")).toBe("");
  });
});

describe("buildPageList", () => {
  it("returns nothing when there are no pages", () => {
    expect(buildPageList(1, 0)).toEqual([]);
  });

  it("lists every page for a short result set", () => {
    expect(buildPageList(1, 3)).toEqual([1, 2, 3]);
  });

  it("windows around the current page", () => {
    expect(buildPageList(6, 10)).toEqual([4, 5, 6, 7, 8]);
  });

  it("keeps a full window at the edges", () => {
    expect(buildPageList(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageList(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });
});
