import { Pagination } from "@/components/catalog/pagination";
import { DeleteReviewButton } from "@/components/reviews/delete-review-button";
import { RatingDistribution } from "@/components/reviews/rating-distribution";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewToolbar } from "@/components/reviews/review-toolbar";
import { StarRating } from "@/components/reviews/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProductRatings,
  getRatingSummary,
  getReviewByUser,
  hasPurchasedProduct,
  listReviewsForProduct,
} from "@/features/reviews/queries";
import { getSessionUser } from "@/lib/auth/session";
import {
  getReviewEligibility,
  ratingDistribution,
} from "@/lib/domain/review";
import { parseReviewListQuery } from "@/lib/validations/review";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function ProductReviews({
  productId,
  productSlug,
  locale,
  searchParams,
}: {
  productId: string;
  productSlug: string;
  locale: string;
  searchParams?: { page?: string; stars?: string; sort?: string };
}) {
  const t = await getTranslations("Reviews");
  const { page, stars, sort } = parseReviewListQuery(searchParams);

  const sessionUser = await getSessionUser();
  const [summary, ratings, listResult, ownReview] = await Promise.all([
    getRatingSummary(productId),
    getProductRatings(productId),
    listReviewsForProduct(productId, {
      page,
      stars,
      sort,
      viewerUserId: sessionUser?.id,
    }),
    sessionUser ? getReviewByUser(sessionUser.id, productId) : null,
  ]);

  const distribution = ratingDistribution(ratings);

  const hasPurchased = sessionUser
    ? await hasPurchasedProduct(sessionUser.id, productId)
    : false;

  const eligibility = getReviewEligibility({
    viewerUserId: sessionUser?.id,
    hasPurchased,
    existingReviewUserId: ownReview?.userId ?? null,
  });

  const listSearchParams: Record<string, string | undefined> = {
    ...searchParams,
    sort: sort === "newest" ? undefined : sort,
    stars: stars !== undefined ? String(stars) : undefined,
  };

  return (
    <section aria-labelledby="reviews-title" className="space-y-6">
      <div className="space-y-2">
        <h2 id="reviews-title" className="font-display text-2xl font-semibold">
          {t("heading")}
        </h2>
        {summary.count > 0 ? (
          <div className="flex items-center gap-3">
            <StarRating
              size="md"
              value={summary.average}
              label={t("ratingSummary", {
                average: summary.average,
                count: summary.count,
              })}
            />
            <p className="text-sm text-muted-foreground">
              {t("ratingSummary", {
                average: summary.average,
                count: summary.count,
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}
      </div>

      <Card className="doodle-radius-card">
        <CardHeader>
          <CardTitle as="h3" className="text-lg">
            {ownReview ? t("editHeading") : t("writeHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {eligibility === "must-sign-in" ? (
            <p className="text-sm text-muted-foreground">{t("signInToReview")}</p>
          ) : eligibility === "must-purchase" ? (
            <p className="text-sm text-muted-foreground">{t("purchaseToReview")}</p>
          ) : (
            <>
              <ReviewForm
                productId={productId}
                existing={
                  ownReview
                    ? {
                        rating: ownReview.rating,
                        title: ownReview.title,
                        body: ownReview.body,
                      }
                    : undefined
                }
              />
              {ownReview ? <DeleteReviewButton productId={productId} /> : null}
            </>
          )}
        </CardContent>
      </Card>

      {summary.count > 0 ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,16rem)_1fr]">
          <RatingDistribution
            distribution={distribution}
            total={summary.count}
            average={summary.average}
            activeStars={stars}
            productSlug={productSlug}
            searchParams={listSearchParams}
          />
          <div className="space-y-4">
            <Suspense fallback={null}>
              <ReviewToolbar sort={sort} />
            </Suspense>
            <ReviewList
              reviews={listResult.items}
              locale={locale}
              signedIn={Boolean(sessionUser)}
            />
            {listResult.pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {t("pageOf", {
                    page: listResult.page,
                    pageCount: listResult.pageCount,
                  })}
                </p>
                <Pagination
                  page={listResult.page}
                  pageCount={listResult.pageCount}
                  searchParams={listSearchParams}
                  basePath={`/product/${productSlug}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
