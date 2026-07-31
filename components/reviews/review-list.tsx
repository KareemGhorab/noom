import { ReportReviewButton } from "@/components/reviews/report-review-button";
import { ReviewHelpfulButton } from "@/components/reviews/review-helpful-button";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import type { ProductReview } from "@/features/reviews/queries";
import { getTranslations } from "next-intl/server";

export async function ReviewList({
  reviews,
  locale,
  signedIn,
}: {
  reviews: ProductReview[];
  locale: string;
  signedIn: boolean;
}) {
  const t = await getTranslations("Reviews");
  const formatDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("emptyFiltered")}</p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="doodle-radius-card border-2 border-border p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StarRating
                  value={review.rating}
                  label={t("stars", { count: review.rating })}
                />
                {review.verifiedPurchase ? (
                  <Badge variant="secondary">{t("verifiedPurchase")}</Badge>
                ) : null}
              </div>
              {review.title ? (
                <p className="font-medium">{review.title}</p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {review.user.name ?? t("anonymous")} ·{" "}
              {formatDate.format(review.createdAt)}
            </p>
          </div>
          <p className="mt-2 leading-7 text-muted-foreground">{review.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ReviewHelpfulButton
              reviewId={review.id}
              helpfulCount={review.helpfulCount}
              viewerVoted={review.viewerVoted}
              signedIn={signedIn}
            />
            <ReportReviewButton reviewId={review.id} signedIn={signedIn} />
          </div>
        </li>
      ))}
    </ul>
  );
}
