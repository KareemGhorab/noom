import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  productVariants,
  reviews,
  reviewVotes,
} from "@/lib/db/schema";
import {
  EMPTY_RATING_SUMMARY,
  ratingDistribution,
  type RatingSummary,
} from "@/lib/domain/review";
import { REVIEWS_PER_PAGE } from "@/lib/validations/pagination";
import type { ReviewSort } from "@/lib/validations/review";
import { and, avg, count, desc, eq, inArray, ne, sql } from "drizzle-orm";

export type ProductReview = {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null };
  helpfulCount: number;
  viewerVoted: boolean;
  verifiedPurchase: boolean;
};

export type ListReviewsResult = {
  items: ProductReview[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listReviewsForProduct(
  productId: string,
  options: {
    page?: number;
    perPage?: number;
    stars?: number;
    sort?: ReviewSort;
    viewerUserId?: string | null;
  } = {},
): Promise<ListReviewsResult> {
  const {
    page = 1,
    perPage = REVIEWS_PER_PAGE,
    stars,
    sort = "newest",
    viewerUserId,
  } = options;

  const conditions = [eq(reviews.productId, productId)];
  if (stars !== undefined) {
    conditions.push(eq(reviews.rating, stars));
  }
  const where = and(...conditions);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(reviews)
    .where(where);

  const pageCount = Math.ceil(total / perPage);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);
  const offset = (safePage - 1) * perPage;

  const helpfulCountSql = sql<number>`(
    select count(*)::int from ${reviewVotes}
    where ${reviewVotes.reviewId} = ${reviews.id}
  )`;

  const rows =
    sort === "helpful"
      ? await db.query.reviews.findMany({
          where,
          with: { user: { columns: { id: true, name: true } } },
          orderBy: [desc(helpfulCountSql), desc(reviews.createdAt)],
          limit: perPage,
          offset,
        })
      : await db.query.reviews.findMany({
          where,
          with: { user: { columns: { id: true, name: true } } },
          orderBy: [desc(reviews.createdAt)],
          limit: perPage,
          offset,
        });

  if (rows.length === 0) {
    return { items: [], total, page: safePage, pageCount };
  }

  const reviewIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.userId))];

  const [voteCounts, viewerVotes, verifiedIds] = await Promise.all([
    db
      .select({
        reviewId: reviewVotes.reviewId,
        value: count(),
      })
      .from(reviewVotes)
      .where(inArray(reviewVotes.reviewId, reviewIds))
      .groupBy(reviewVotes.reviewId),
    viewerUserId
      ? db
          .select({ reviewId: reviewVotes.reviewId })
          .from(reviewVotes)
          .where(
            and(
              eq(reviewVotes.userId, viewerUserId),
              inArray(reviewVotes.reviewId, reviewIds),
            ),
          )
      : Promise.resolve([] as { reviewId: string }[]),
    getVerifiedPurchaseUserIds(productId, authorIds),
  ]);

  const helpfulById = new Map(
    voteCounts.map((row) => [row.reviewId, row.value]),
  );
  const viewerVotedIds = new Set(viewerVotes.map((row) => row.reviewId));

  const items: ProductReview[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: row.user,
    helpfulCount: helpfulById.get(row.id) ?? 0,
    viewerVoted: viewerVotedIds.has(row.id),
    verifiedPurchase: verifiedIds.has(row.userId),
  }));

  return { items, total, page: safePage, pageCount };
}

/**
 * Lightweight rating column fetch so the PDP can build a distribution with
 * `ratingDistribution` without loading full review rows.
 */
export async function getProductRatings(productId: string): Promise<number[]> {
  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  return rows.map((row) => row.rating);
}

export async function getRatingDistribution(productId: string) {
  const ratings = await getProductRatings(productId);
  return ratingDistribution(ratings);
}

export async function getReviewByUser(userId: string, productId: string) {
  return db.query.reviews.findFirst({
    where: and(eq(reviews.userId, userId), eq(reviews.productId, productId)),
  });
}

export async function getReviewById(reviewId: string) {
  return db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      product: { columns: { slug: true } },
    },
  });
}

export async function getRatingSummary(
  productId: string,
): Promise<RatingSummary> {
  const summaries = await getRatingSummaries([productId]);
  return summaries.get(productId) ?? EMPTY_RATING_SUMMARY;
}

/**
 * Catalog grids render many cards at once, so ratings are fetched in one
 * grouped query instead of a per-card round trip.
 */
export async function getRatingSummaries(
  productIds: readonly string[],
): Promise<Map<string, RatingSummary>> {
  const summaries = new Map<string, RatingSummary>();
  if (productIds.length === 0) return summaries;

  const rows = await db
    .select({
      productId: reviews.productId,
      average: avg(reviews.rating),
      total: count(),
    })
    .from(reviews)
    .where(inArray(reviews.productId, [...productIds]))
    .groupBy(reviews.productId);

  for (const row of rows) {
    const average = Number(row.average ?? 0);
    summaries.set(row.productId, {
      average: Math.round(average * 10) / 10,
      count: row.total,
    });
  }

  return summaries;
}

/**
 * A cancelled order does not count: the shopper never kept the product.
 */
export async function hasPurchasedProduct(userId: string, productId: string) {
  const verified = await getVerifiedPurchaseUserIds(productId, [userId]);
  return verified.has(userId);
}

/**
 * Batch purchase check for review authors on a PDP page — one query instead of
 * N `hasPurchasedProduct` round trips.
 */
export async function getVerifiedPurchaseUserIds(
  productId: string,
  userIds: readonly string[],
): Promise<Set<string>> {
  const verified = new Set<string>();
  if (userIds.length === 0) return verified;

  const rows = await db
    .selectDistinct({ userId: orders.userId })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(
      productVariants,
      eq(orderItems.variantId, productVariants.id),
    )
    .where(
      and(
        eq(productVariants.productId, productId),
        inArray(orders.userId, [...userIds]),
        ne(orders.status, "cancelled"),
      ),
    );

  for (const row of rows) {
    if (row.userId) verified.add(row.userId);
  }

  return verified;
}
