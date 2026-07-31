import { ACTION_ERROR_CODES } from "@/lib/errors";
import { describe, expect, it } from "vitest";
import ar from "./ar.json";
import en from "./en.json";

type MessageTree = { [key: string]: string | MessageTree };

function flattenKeys(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });
}

const enKeys = flattenKeys(en as MessageTree);
const arKeys = flattenKeys(ar as MessageTree);

describe("message files", () => {
  it("have identical key sets", () => {
    const missingInAr = enKeys.filter((key) => !arKeys.includes(key));
    const missingInEn = arKeys.filter((key) => !enKeys.includes(key));

    expect({ missingInAr, missingInEn }).toEqual({
      missingInAr: [],
      missingInEn: [],
    });
  });

  it("have no empty values", () => {
    for (const [locale, keys, tree] of [
      ["en", enKeys, en as MessageTree],
      ["ar", arKeys, ar as MessageTree],
    ] as const) {
      const empty = keys.filter((key) => {
        const value = key
          .split(".")
          .reduce<string | MessageTree>(
            (node, part) => (node as MessageTree)[part],
            tree,
          );
        return typeof value === "string" && value.trim() === "";
      });

      expect({ locale, empty }).toEqual({ locale, empty: [] });
    }
  });

  it("translate every server-action error code in both locales", () => {
    for (const code of ACTION_ERROR_CODES) {
      expect(enKeys).toContain(`Errors.${code}`);
      expect(arKeys).toContain(`Errors.${code}`);
    }
  });
});
