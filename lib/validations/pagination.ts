import { z } from "zod";
import { parseBoundedInt } from "./catalog-query";

export const ORDERS_PER_PAGE = 10;
// Lower than the search grid's 12: wishlist cards are large, so more than a
// handful per page pushes pagination controls below the fold on mobile.
export const WISHLIST_PER_PAGE = 8;
/** PDP review section — keep the list short so filters stay in view. */
export const REVIEWS_PER_PAGE = 5;

const pageQuerySchema = z.object({
  page: z
    .unknown()
    .optional()
    .transform((value) => parseBoundedInt(value, 1, 1, 1000)),
});

/**
 * A single-field cousin of `catalogQuerySchema` for lists that only ever
 * page — order history and wishlist — so they don't grow unbounded as a
 * shopper's history does.
 */
export function parsePageQuery(input: { page?: string }): number {
  return pageQuerySchema.parse(input).page;
}
