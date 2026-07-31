import { MAX_RATING, MIN_RATING } from "@/lib/validations/review";

export type RatingSummary = {
  average: number;
  count: number;
};

export const EMPTY_RATING_SUMMARY: RatingSummary = { average: 0, count: 0 };

/** Rounds to one decimal so `4.25` renders as `4.3` rather than `4.25`. */
export function averageRating(ratings: readonly number[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function summarizeRatings(ratings: readonly number[]): RatingSummary {
  return { average: averageRating(ratings), count: ratings.length };
}

/**
 * Half-star rendering is not part of the doodle theme, so a summary rounds to
 * the nearest whole star for the icon row while the numeric average stays exact.
 */
export function toStarCount(average: number): number {
  const rounded = Math.round(average);
  return Math.min(MAX_RATING, Math.max(0, rounded));
}

export function ratingDistribution(
  ratings: readonly number[],
): Record<number, number> {
  const buckets: Record<number, number> = {};
  for (let rating = MIN_RATING; rating <= MAX_RATING; rating += 1) {
    buckets[rating] = 0;
  }
  for (const rating of ratings) {
    if (rating >= MIN_RATING && rating <= MAX_RATING) {
      buckets[rating] += 1;
    }
  }
  return buckets;
}

export type ReviewEligibilityInput = {
  viewerUserId?: string | null;
  hasPurchased: boolean;
  existingReviewUserId?: string | null;
};

export type ReviewEligibility =
  | "can-review"
  | "already-reviewed"
  | "must-purchase"
  | "must-sign-in";

/**
 * Reviews are limited to buyers so the demo catalog cannot be rated by
 * drive-by traffic; a shopper keeps exactly one review per product.
 */
export function getReviewEligibility({
  viewerUserId,
  hasPurchased,
  existingReviewUserId,
}: ReviewEligibilityInput): ReviewEligibility {
  if (!viewerUserId) return "must-sign-in";
  if (existingReviewUserId === viewerUserId) return "already-reviewed";
  if (!hasPurchased) return "must-purchase";
  return "can-review";
}

export function canDeleteReview(
  viewerUserId: string | null | undefined,
  reviewUserId: string,
): boolean {
  return Boolean(viewerUserId) && viewerUserId === reviewUserId;
}
