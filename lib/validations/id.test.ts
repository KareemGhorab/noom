import { describe, expect, it } from "vitest";
import { parseUuid } from "./id";

describe("parseUuid", () => {
  it("accepts a valid uuid", () => {
    const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(parseUuid(id)).toBe(id);
  });

  it("rejects arbitrary path segments", () => {
    expect(parseUuid("not-a-uuid")).toBeNull();
    expect(parseUuid("does-not-exist-noom")).toBeNull();
    expect(parseUuid("")).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(parseUuid(undefined)).toBeNull();
    expect(parseUuid(null)).toBeNull();
    expect(parseUuid(42)).toBeNull();
  });
});
