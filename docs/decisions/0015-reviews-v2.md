# 0015 — Reviews v2 (distribution, votes, reports)

- Date: 2026-07-31
- Status: accepted
- Extends: [0009](0009-reviews-and-ratings.md)

## Context

ADR 0009 shipped purchase-gated reviews with a numeric average and a flat
newest-first list. The PDP still felt thin: no rating breakdown, no way to
narrow to five-star takes, no helpfulness signal, and nothing a shopper could
do about a bad review short of ignoring it. Half-stars and admin moderation
remain out of scope for the doodle demo.

## Decision

- Reuse `ratingDistribution` / `toStarCount` from `lib/domain/review.ts` on the
  PDP. Ratings are fetched as a slim column list so the pure helper stays the
  single bucket implementation.
- Filter (`?stars=`), sort (`?sort=newest|helpful`), and page (`?page=`) live
  on the product URL and reuse `REVIEWS_PER_PAGE` / `parseReviewListQuery`.
- `review_vote` is a `(review_id, user_id)` primary key — one upvote per
  shopper, deleted to toggle off. Sort by helpful uses a correlated vote count.
- `review_report` is unique on `(review_id, user_id)` with an optional reason.
  There is no moderation UI; the action rate-limits lightly and returns
  `alreadyReported` on a second submit. Soft UX only ("Report submitted").
- Verified-purchase badges batch-check non-cancelled orders for the authors on
  the current page (same gate as posting). Seeded reviews keep matching orders
  so the badge is visible in the demo.

## Consequences

- Cascades on review/user delete clear votes and reports.
- Helpfulness and reports require sign-in; guests still see counts and the
  verified badge.
- "Most helpful" with zero votes falls back to newest via a secondary
  `created_at` order.
