import { describe, expect, it } from "vitest";
import { parsePageQuery } from "./pagination";

describe("parsePageQuery", () => {
  it("defaults to page 1", () => {
    expect(parsePageQuery({})).toBe(1);
  });

  it("clamps non-positive and non-numeric input to 1", () => {
    expect(parsePageQuery({ page: "0" })).toBe(1);
    expect(parsePageQuery({ page: "-4" })).toBe(1);
    expect(parsePageQuery({ page: "abc" })).toBe(1);
  });

  it("caps an out-of-range page at 1000", () => {
    expect(parsePageQuery({ page: "999999" })).toBe(1000);
  });

  it("parses a valid page number", () => {
    expect(parsePageQuery({ page: "3" })).toBe(3);
  });
});
