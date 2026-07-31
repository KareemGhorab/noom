import { describe, expect, it } from "vitest";
import { parseReviewListQuery, reviewSchema } from "./review";

const productId = "3f1f8c3a-8f5a-4a5f-9f4c-1b6f8f0c9a11";

describe("parseReviewListQuery", () => {
  it("defaults to page 1, newest, and no star filter", () => {
    expect(parseReviewListQuery({})).toEqual({
      page: 1,
      stars: undefined,
      sort: "newest",
    });
  });

  it("accepts stars and helpful sort", () => {
    expect(
      parseReviewListQuery({ page: "2", stars: "5", sort: "helpful" }),
    ).toEqual({ page: 2, stars: 5, sort: "helpful" });
  });

  it("drops invalid stars and sort", () => {
    expect(
      parseReviewListQuery({ stars: "9", sort: "loudest" }),
    ).toEqual({ page: 1, stars: undefined, sort: "newest" });
  });
});

describe("reviewSchema", () => {
  it("accepts a valid review and drops an empty title", () => {
    const parsed = reviewSchema.parse({
      productId,
      rating: "5",
      title: "",
      body: "  Genuinely useful for the demo catalog.  ",
    });

    expect(parsed).toEqual({
      productId,
      rating: 5,
      title: undefined,
      body: "Genuinely useful for the demo catalog.",
    });
  });

  it("rejects ratings outside 1-5", () => {
    for (const rating of [0, 6, 2.5]) {
      expect(
        reviewSchema.safeParse({
          productId,
          rating,
          body: "A body long enough to pass.",
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a short body", () => {
    expect(
      reviewSchema.safeParse({ productId, rating: 4, body: "too short" })
        .success,
    ).toBe(false);
  });

  it("rejects a non-uuid product id", () => {
    expect(
      reviewSchema.safeParse({
        productId: "not-a-uuid",
        rating: 4,
        body: "A body long enough to pass.",
      }).success,
    ).toBe(false);
  });
});
