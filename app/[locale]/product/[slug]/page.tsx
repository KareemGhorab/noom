import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getLocalizedCategoryName,
  getLocalizedProductDescription,
  getLocalizedProductTitle,
  getProductBySlug,
} from "@/features/catalog/queries";
import { getSessionUser } from "@/lib/auth/session";
import { isProductWishlisted } from "@/features/wishlist/queries";
import { formatPrice } from "@/lib/domain/order";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import { Badge } from "@/components/ui/badge";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const sessionUser = await getSessionUser();
  const wishlisted = sessionUser
    ? await isProductWishlisted(sessionUser.id, product.id)
    : false;

  const t = await getTranslations("Product");
  const common = await getTranslations("Common");
  const title = getLocalizedProductTitle(product, locale);
  const description = getLocalizedProductDescription(product, locale);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
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
            {t("category")}: {getLocalizedCategoryName(product.category, locale)}
          </Badge>
          <h1 className="font-display text-4xl font-bold">{title}</h1>
          <p className="text-2xl font-semibold">
            {formatPrice(product.priceCents, product.currency, locale)}
          </p>
          <p className="text-muted-foreground">
            {product.stock > 0 ? common("inStock") : common("outOfStock")}
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold">
            {t("description")}
          </h2>
          <p className="leading-7 text-muted-foreground">{description}</p>
        </div>
        <div className="flex max-w-sm flex-col gap-2">
          <AddToCartButton
            productId={product.id}
            disabled={product.stock <= 0}
          />
          <WishlistButton
            productId={product.id}
            initialWishlisted={wishlisted}
            signedIn={Boolean(sessionUser)}
          />
        </div>
      </div>
    </div>
  );
}
