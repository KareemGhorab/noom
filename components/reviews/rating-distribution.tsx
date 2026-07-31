import { Link } from "@/i18n/navigation";
import { toStarCount } from "@/lib/domain/review";
import { MAX_RATING, MIN_RATING } from "@/lib/validations/review";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export async function RatingDistribution({
  distribution,
  total,
  average,
  activeStars,
  productSlug,
  searchParams,
}: {
  distribution: Record<number, number>;
  total: number;
  average: number;
  activeStars?: number;
  productSlug: string;
  searchParams: Record<string, string | undefined>;
}) {
  const t = await getTranslations("Reviews");
  const starCount = toStarCount(average);

  function hrefFor(stars: number | undefined) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "" && key !== "page" && key !== "stars") {
        params.set(key, value);
      }
    }
    if (stars !== undefined) {
      params.set("stars", String(stars));
    }
    const query = params.toString();
    return query
      ? `/product/${productSlug}?${query}`
      : `/product/${productSlug}`;
  }

  return (
    <div className="space-y-3" aria-label={t("distributionLabel")}>
      <p className="text-sm text-muted-foreground">
        {t("distributionSummary", {
          average,
          stars: starCount,
          count: total,
        })}
      </p>
      <ul className="space-y-2">
        {Array.from(
          { length: MAX_RATING - MIN_RATING + 1 },
          (_, index) => MAX_RATING - index,
        ).map((rating) => {
          const count = distribution[rating] ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          const isActive = activeStars === rating;

          return (
            <li key={rating}>
              <Link
                href={hrefFor(isActive ? undefined : rating)}
                className={cn(
                  "grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3 text-sm",
                  isActive && "font-medium",
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <span>{t("stars", { count: rating })}</span>
                <span
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <span
                    className="block h-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="text-end text-muted-foreground">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {activeStars !== undefined ? (
        <Link
          href={hrefFor(undefined)}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("clearFilter")}
        </Link>
      ) : null}
    </div>
  );
}
