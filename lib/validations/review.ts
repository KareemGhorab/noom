import { z } from "zod";
import { parseBoundedInt } from "./catalog-query";

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export const REVIEW_SORTS = ["newest", "helpful"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const ratingField = z.coerce
  .number()
  .int("Rating must be a whole number")
  .min(MIN_RATING, "Rating must be at least 1")
  .max(MAX_RATING, "Rating cannot exceed 5");

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: ratingField,
  title: z
    .string()
    .trim()
    .max(100, "Title is too long")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  body: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review is too long"),
});

export const reviewDeleteSchema = z.object({
  productId: z.string().uuid(),
});

export const reviewIdSchema = z.object({
  reviewId: z.string().uuid(),
});

export const reportReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .max(500, "Reason is too long")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

const reviewListQuerySchema = z.object({
  page: z
    .unknown()
    .optional()
    .transform((value) => parseBoundedInt(value, 1, 1, 1000)),
  stars: z
    .unknown()
    .optional()
    .transform((value): number | undefined => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      const parsed = z.coerce
        .number()
        .int()
        .min(MIN_RATING)
        .max(MAX_RATING)
        .safeParse(value);
      return parsed.success ? parsed.data : undefined;
    }),
  sort: z
    .unknown()
    .optional()
    .transform((value): ReviewSort =>
      REVIEW_SORTS.includes(value as ReviewSort)
        ? (value as ReviewSort)
        : "newest",
    ),
});

/**
 * PDP review section filters. Invalid `stars` / `sort` degrade to "show all /
 * newest" so a bad query string never blanks the section.
 */
export function parseReviewListQuery(input?: {
  page?: string;
  stars?: string;
  sort?: string;
} | null): { page: number; stars?: number; sort: ReviewSort } {
  return reviewListQuerySchema.parse(input ?? {});
}

export type ReviewInput = z.infer<typeof reviewSchema>;
