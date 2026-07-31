import { z } from "zod";
import { normalizeSearchQuery } from "./search";

export const CATALOG_SORTS = [
  "newest",
  "priceAsc",
  "priceDesc",
  "rating",
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const DEFAULT_PER_PAGE = 12;
export const MAX_PER_PAGE = 48;

const MAX_PRICE_MAJOR_UNITS = 10_000_000;

function parsePrice(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = z.coerce
    .number()
    .int()
    .min(0)
    .max(MAX_PRICE_MAJOR_UNITS)
    .safeParse(value);

  return parsed.success ? parsed.data : undefined;
}

export function parseBoundedInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = z.coerce.number().int().safeParse(value);

  if (!parsed.success) {
    return fallback;
  }

  return Math.min(Math.max(parsed.data, min), max);
}

/**
 * Everything here is attacker-controlled query-string input, so each field
 * degrades to its default rather than failing the whole parse — a bad `sort`
 * must not discard a valid `q`.
 */
export const catalogQuerySchema = z
  .object({
    q: z
      .unknown()
      .optional()
      .transform((value) =>
        normalizeSearchQuery(typeof value === "string" ? value : ""),
      ),
    category: z
      .unknown()
      .optional()
      .transform((value) => {
        if (typeof value !== "string") {
          return undefined;
        }
        const trimmed = value.trim();
        return trimmed === "" || trimmed.length > 100 ? undefined : trimmed;
      }),
    sort: z
      .unknown()
      .optional()
      .transform((value): CatalogSort =>
        CATALOG_SORTS.includes(value as CatalogSort)
          ? (value as CatalogSort)
          : "newest",
      ),
    minPrice: z.unknown().optional().transform(parsePrice),
    maxPrice: z.unknown().optional().transform(parsePrice),
    page: z
      .unknown()
      .optional()
      .transform((value) => parseBoundedInt(value, 1, 1, 1000)),
    perPage: z
      .unknown()
      .optional()
      .transform((value) =>
        parseBoundedInt(value, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE),
      ),
  })
  // A reversed range would silently return nothing, so swap it instead.
  .transform((value) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      return { ...value, minPrice: value.maxPrice, maxPrice: value.minPrice };
    }
    return value;
  });

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export function parseCatalogQuery(input: {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  perPage?: string;
}): CatalogQuery {
  return catalogQuerySchema.parse(input);
}
