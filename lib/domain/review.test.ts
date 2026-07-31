import { describe, expect, it } from "vitest";
import {
    averageRating,
    canDeleteReview,
    getReviewEligibility,
    ratingDistribution,
    summarizeRatings,
    toStarCount,
} from "./review";

describe("averageRating", () => {
  it("returns zero for no ratings", () => {
    expect(averageRating([])).toBe(0);
  });

  it("rounds to one decimal place", () => {
    expect(averageRating([4, 5, 4, 4])).toBe(4.3);
    expect(averageRating([5, 5, 5])).toBe(5);
  });
});

describe("summarizeRatings", () => {
  it("reports the average and the count", () => {
    expect(summarizeRatings([3, 5])).toEqual({ average: 4, count: 2 });
    expect(summarizeRatings([])).toEqual({ average: 0, count: 0 });
  });
});

describe("toStarCount", () => {
  it("rounds to the nearest whole star and clamps", () => {
    expect(toStarCount(4.3)).toBe(4);
    expect(toStarCount(4.6)).toBe(5);
    expect(toStarCount(0)).toBe(0);
    expect(toStarCount(9)).toBe(5);
    expect(toStarCount(-2)).toBe(0);
  });
});

describe("ratingDistribution", () => {
  it("counts each bucket and ignores out-of-range values", () => {
    expect(ratingDistribution([5, 5, 3, 0, 7])).toEqual({
      1: 0,
      2: 0,
      3: 1,
      4: 0,
      5: 2,
    });
  });
});

describe("getReviewEligibility", () => {
  it("requires a signed-in shopper", () => {
    expect(
      getReviewEligibility({ viewerUserId: null, hasPurchased: true }),
    ).toBe("must-sign-in");
  });

  it("requires a purchase", () => {
    expect(
      getReviewEligibility({ viewerUserId: "user-1", hasPurchased: false }),
    ).toBe("must-purchase");
  });

  it("blocks a second review from the same shopper", () => {
    expect(
      getReviewEligibility({
        viewerUserId: "user-1",
        hasPurchased: true,
        existingReviewUserId: "user-1",
      }),
    ).toBe("already-reviewed");
  });

  it("allows a buyer without a review yet", () => {
    expect(
      getReviewEligibility({
        viewerUserId: "user-1",
        hasPurchased: true,
        existingReviewUserId: null,
      }),
    ).toBe("can-review");
  });
});

describe("canDeleteReview", () => {
  it("only allows the review author", () => {
    expect(canDeleteReview("user-1", "user-1")).toBe(true);
    expect(canDeleteReview("user-2", "user-1")).toBe(false);
    expect(canDeleteReview(null, "user-1")).toBe(false);
  });
});
