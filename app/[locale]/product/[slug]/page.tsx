import { ProductCard } from "@/components/catalog/product-card";
import { RecentlyViewedTracker } from "@/components/catalog/recently-viewed-tracker";
import { VariantPicker } from "@/components/catalog/variant-picker";
import {
  WishlistHeart,
  WishlistHeartSkeleton,
} from "@/components/catalog/wishlist-heart";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import {
  getLocalizedCategoryName,
  getLocalizedProductDescription,
  getLocalizedProductTitle,
  getProductBySlug,
  getRelatedProducts,
} from "@/features/catalog/queries";
import { getRatingSummaries, getRatingSummary } from "@/features/reviews/queries";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveCurrency } from "@/lib/currency/preference";
import { summarizeVariants } from "@/lib/domain/catalog";
import { formatPrice } from "@/lib/domain/order";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const currency = await getActiveCurrency();
  const product = await getProductBySlug(slug, currency);

  if (!product) {
    const t = await getTranslations({ locale, namespace: "Product" });
    return { title: t("notFoundTitle") };
  }

  return {
    title: getLocalizedProductTitle(product, locale),
    description: getLocalizedProductDescription(product, locale),
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string; stars?: string; sort?: string }>;
}) {
  const { locale, slug } = await params;
  const reviewParams = await searchParams;
  setRequestLocale(locale);

  const currency = await getActiveCurrency();
  const product = await getProductBySlug(slug, currency);
  if (!product) {
    notFound();
  }

  const sessionUser = await getSessionUser();
  const t = await getTranslations("Product");
  const errors = await getTranslations("Errors");
  const tReviews = await getTranslations("Reviews");
  const rating = await getRatingSummary(product.id);
  const title = getLocalizedProductTitle(product, locale);
  const description = getLocalizedProductDescription(product, locale);
  const { minPriceCents, maxPriceCents, hasPrice } = summarizeVariants(
    product.variants,
  );
  const priceLabel = !hasPrice
    ? errors("priceUnavailable")
    : minPriceCents === maxPriceCents
      ? formatPrice(minPriceCents, currency, locale)
      : `${formatPrice(minPriceCents, currency, locale)} – ${formatPrice(maxPriceCents, currency, locale)}`;

  const related = await getRelatedProducts({
    productId: product.id,
    categoryId: product.categoryId,
    currency,
  });

  const relatedRatings = await getRatingSummaries(
    related.map((item) => item.id),
  );

  return (
    <div className="space-y-12">
      <RecentlyViewedTracker slug={product.slug} />
      <section
        aria-labelledby="product-title"
        className="grid gap-8 lg:grid-cols-2"
      >
        <div className="relative aspect-square overflow-hidden doodle-radius-media bg-muted">
          <Image
            src={product.imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="secondary">
              {t("category")}:{" "}
              {getLocalizedCategoryName(product.category, locale)}
            </Badge>
            <h1 id="product-title" className="font-display text-4xl font-bold">
              {title}
            </h1>
            {rating.count > 0 ? (
              <a href="#reviews-title" className="flex w-fit items-center gap-2">
                <StarRating
                  value={rating.average}
                  label={tReviews("ratingSummary", {
                    average: rating.average,
                    count: rating.count,
                  })}
                />
                <span className="text-sm text-muted-foreground">
                  {tReviews("ratingSummary", {
                    average: rating.average,
                    count: rating.count,
                  })}
                </span>
              </a>
            ) : null}
            {product.options.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("fromPrice", { price: priceLabel })}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold">
              {t("description")}
            </h2>
            <p className="leading-7 text-muted-foreground">{description}</p>
          </div>
          <div className="flex max-w-sm flex-col gap-2">
            <VariantPicker
              locale={locale}
              currency={currency}
              options={product.options}
              variants={product.variants}
              sessionEmail={sessionUser?.email}
            />
            <Suspense fallback={<WishlistHeartSkeleton />}>
              <WishlistHeart productId={product.id} />
            </Suspense>
          </div>
        </div>
      </section>

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        locale={locale}
        searchParams={reviewParams}
      />

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="space-y-4">
          <h2
            id="related-title"
            className="font-display text-2xl font-semibold"
          >
            {t("related")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                locale={locale}
                currency={currency}
                product={item}
                rating={relatedRatings.get(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
