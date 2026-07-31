import { describe, expect, it } from "vitest";
import { isOverLimit, windowStart } from "./rate-limit";

describe("windowStart", () => {
  it("floors to the start of the current window", () => {
    expect(windowStart(1_000, 500)).toBe(1_000);
    expect(windowStart(1_250, 500)).toBe(1_000);
    expect(windowStart(1_499, 500)).toBe(1_000);
    expect(windowStart(1_500, 500)).toBe(1_500);
  });

  it("handles zero", () => {
    expect(windowStart(0, 60_000)).toBe(0);
  });
});

describe("isOverLimit", () => {
  it("allows counts at or under the limit", () => {
    expect(isOverLimit(1, 5)).toBe(false);
    expect(isOverLimit(5, 5)).toBe(false);
  });

  it("rejects counts over the limit", () => {
    expect(isOverLimit(6, 5)).toBe(true);
  });
});
