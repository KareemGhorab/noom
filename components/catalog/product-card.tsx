import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import {
  WishlistHeart,
  WishlistHeartSkeleton,
} from "@/components/catalog/wishlist-heart";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getLocalizedCategoryName,
  getLocalizedProductTitle,
} from "@/features/catalog/queries";
import { Link } from "@/i18n/navigation";
import { getStockState, summarizeVariants } from "@/lib/domain/catalog";
import { formatPrice } from "@/lib/domain/order";
import type { RatingSummary } from "@/lib/domain/review";
import type { CurrencyCode } from "@/lib/i18n/currency";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Suspense } from "react";

type ProductCardProps = {
  locale: string;
  currency: CurrencyCode;
  product: {
    id: string;
    slug: string;
    titleEn: string;
    titleAr: string;
    imageUrl: string;
    category: {
      nameEn: string;
      nameAr: string;
      slug: string;
    };
    variants: {
      id: string;
      priceCents: number | null;
      stock: number;
      optionValues: Record<string, string>;
    }[];
  };
  /**
   * When the caller already knows the shopper's wishlist state (e.g. the
   * wishlist page itself), pass it directly to skip the extra lookup.
   * Otherwise the heart resolves its own session + wishlist state behind a
   * Suspense boundary, so grids don't have to await `auth()` up front.
   */
  wishlistState?: { wishlisted: boolean; signedIn: boolean };
  rating?: RatingSummary;
};

function formatCardPrice(
  minPriceCents: number,
  maxPriceCents: number,
  currency: string,
  locale: string,
) {
  const min = formatPrice(minPriceCents, currency, locale);
  if (minPriceCents === maxPriceCents) {
    return min;
  }

  return `${min} – ${formatPrice(maxPriceCents, currency, locale)}`;
}

export async function ProductCard({
  locale,
  currency,
  product,
  wishlistState,
  rating,
}: ProductCardProps) {
  const t = await getTranslations("Common");
  const errors = await getTranslations("Errors");
  const tReviews = await getTranslations("Reviews");
  const title = getLocalizedProductTitle(product, locale);
  const categoryName = getLocalizedCategoryName(product.category, locale);
  const { minPriceCents, maxPriceCents, totalStock, hasPrice } =
    summarizeVariants(product.variants);
  const stockState = getStockState(totalStock);
  const singleVariant =
    product.variants.length === 1 ? product.variants[0] : null;
  const canBuySingle =
    singleVariant != null &&
    singleVariant.priceCents != null &&
    singleVariant.stock > 0;

  return (
    <Card className="doodle-radius-card overflow-hidden">
      <CardHeader className="space-y-3">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden doodle-radius-media bg-muted">
            <Image
              src={product.imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        </Link>
        <div className="flex items-start justify-between gap-2">
          <CardTitle as="h3" className="text-lg">
            <Link href={`/product/${product.slug}`}>{title}</Link>
          </CardTitle>
          <Badge variant="secondary">{categoryName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {rating && rating.count > 0 ? (
          <div className="mb-1 flex items-center gap-2">
            <StarRating
              value={rating.average}
              label={tReviews("ratingSummary", {
                average: rating.average,
                count: rating.count,
              })}
            />
            <span className="text-sm text-muted-foreground">
              {rating.count}
            </span>
          </div>
        ) : null}
        <p className="text-lg font-semibold">
          {hasPrice
            ? formatCardPrice(
                minPriceCents,
                maxPriceCents,
                currency,
                locale,
              )
            : errors("priceUnavailable")}
        </p>
        <p
          className={
            stockState === "low"
              ? "text-sm font-medium text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {stockState === "out"
            ? t("outOfStock")
            : stockState === "low"
              ? t("lowStock", { count: totalStock })
              : t("inStock")}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {singleVariant ? (
          <AddToCartButton
            variantId={singleVariant.id}
            disabled={!canBuySingle}
          />
        ) : (
          <Link
            href={`/product/${product.slug}`}
            className={cn(buttonVariants(), "w-full")}
          >
            {t("viewOptions")}
          </Link>
        )}
        {wishlistState ? (
          <WishlistButton
            productId={product.id}
            initialWishlisted={wishlistState.wishlisted}
            signedIn={wishlistState.signedIn}
          />
        ) : (
          <Suspense fallback={<WishlistHeartSkeleton />}>
            <WishlistHeart productId={product.id} />
          </Suspense>
        )}
      </CardFooter>
    </Card>
  );
}
