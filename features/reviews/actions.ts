"use server";

import { isEmailVerified } from "@/features/auth/queries";
import {
  getReviewById,
  hasPurchasedProduct,
} from "@/features/reviews/queries";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { products, reviews, reviewReports, reviewVotes } from "@/lib/db/schema";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { RATE_LIMITS } from "@/lib/rate-limit/limits";
import { getClientIp } from "@/lib/request/client-ip";
import {
  reportReviewSchema,
  reviewDeleteSchema,
  reviewIdSchema,
  reviewSchema,
} from "@/lib/validations/review";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ReviewActionState = {
  ok: boolean;
  code?: ActionErrorCode;
  saved?: boolean;
  reported?: boolean;
  voted?: boolean;
  helpfulCount?: number;
};

export async function saveReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  if (!(await isEmailVerified(user.id))) {
    return actionError("emailNotVerified");
  }

  const ip = await getClientIp();
  const { allowed } = await consumeRateLimit(
    `review:${ip}:${user.id}`,
    RATE_LIMITS.review.limit,
    RATE_LIMITS.review.windowMs,
  );
  if (!allowed) {
    return actionError("tooManyRequests");
  }

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return actionError("invalidReview");
  }

  const { productId, rating, title, body } = parsed.data;

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { slug: true },
  });

  if (!product) {
    return actionError("productNotFound");
  }

  if (!(await hasPurchasedProduct(user.id, productId))) {
    return actionError("reviewRequiresPurchase");
  }

  // Editing an existing review reuses the same insert, so the unique
  // (user, product) constraint is the single source of truth for "one review".
  await db
    .insert(reviews)
    .values({ userId: user.id, productId, rating, title, body })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.productId],
      set: { rating, title: title ?? null, body, updatedAt: new Date() },
    });

  revalidatePath(`/product/${product.slug}`, "page");
  return { ok: true, saved: true };
}

export async function deleteReviewAction(
  productId: string,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const parsed = reviewDeleteSchema.safeParse({ productId });
  if (!parsed.success) {
    return actionError("reviewNotFound");
  }

  const deleted = await db
    .delete(reviews)
    .where(
      and(
        eq(reviews.userId, user.id),
        eq(reviews.productId, parsed.data.productId),
      ),
    )
    .returning({ id: reviews.id });

  if (deleted.length === 0) {
    return actionError("reviewNotFound");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function voteReviewHelpfulAction(
  reviewId: string,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const parsed = reviewIdSchema.safeParse({ reviewId });
  if (!parsed.success) {
    return actionError("reviewNotFound");
  }

  const review = await getReviewById(parsed.data.reviewId);
  if (!review) {
    return actionError("reviewNotFound");
  }

  const existing = await db.query.reviewVotes.findFirst({
    where: and(
      eq(reviewVotes.reviewId, review.id),
      eq(reviewVotes.userId, user.id),
    ),
  });

  if (existing) {
    await db
      .delete(reviewVotes)
      .where(
        and(
          eq(reviewVotes.reviewId, review.id),
          eq(reviewVotes.userId, user.id),
        ),
      );
  } else {
    await db.insert(reviewVotes).values({
      reviewId: review.id,
      userId: user.id,
    });
  }

  const [{ value: helpfulCount }] = await db
    .select({ value: count() })
    .from(reviewVotes)
    .where(eq(reviewVotes.reviewId, review.id));

  revalidatePath(`/product/${review.product.slug}`, "page");
  return {
    ok: true,
    voted: !existing,
    helpfulCount,
  };
}

export async function reportReviewAction(
  reviewId: string,
  reason?: string,
): Promise<ReviewActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const ip = await getClientIp();
  const { allowed } = await consumeRateLimit(
    `review-report:${ip}:${user.id}`,
    RATE_LIMITS.reviewReport.limit,
    RATE_LIMITS.reviewReport.windowMs,
  );
  if (!allowed) {
    return actionError("tooManyRequests");
  }

  const parsed = reportReviewSchema.safeParse({ reviewId, reason });
  if (!parsed.success) {
    return actionError("reviewNotFound");
  }

  const review = await getReviewById(parsed.data.reviewId);
  if (!review) {
    return actionError("reviewNotFound");
  }

  const already = await db.query.reviewReports.findFirst({
    where: and(
      eq(reviewReports.reviewId, review.id),
      eq(reviewReports.userId, user.id),
    ),
  });

  if (already) {
    return actionError("alreadyReported");
  }

  await db.insert(reviewReports).values({
    reviewId: review.id,
    userId: user.id,
    reason: parsed.data.reason,
  });

  revalidatePath(`/product/${review.product.slug}`, "page");
  return { ok: true, reported: true };
}
