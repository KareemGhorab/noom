import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import { Badge } from "@/components/ui/badge";
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
import { formatPrice } from "@/lib/domain/order";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

type ProductCardProps = {
  locale: string;
  product: {
    id: string;
    slug: string;
    titleEn: string;
    titleAr: string;
    priceCents: number;
    currency: string;
    stock: number;
    imageUrl: string;
    category: {
      nameEn: string;
      nameAr: string;
      slug: string;
    };
  };
  wishlisted?: boolean;
  signedIn?: boolean;
};

export async function ProductCard({
  locale,
  product,
  wishlisted = false,
  signedIn = false,
}: ProductCardProps) {
  const t = await getTranslations("Common");
  const title = getLocalizedProductTitle(product, locale);
  const categoryName = getLocalizedCategoryName(product.category, locale);

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
          <CardTitle className="text-lg">
            <Link href={`/product/${product.slug}`}>{title}</Link>
          </CardTitle>
          <Badge variant="secondary">{categoryName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">
          {formatPrice(product.priceCents, product.currency, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {product.stock > 0 ? t("inStock") : t("outOfStock")}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
        <WishlistButton
          productId={product.id}
          initialWishlisted={wishlisted}
          signedIn={signedIn}
        />
      </CardFooter>
    </Card>
  );
}
