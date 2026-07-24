import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getProductsByCategorySlug,
  searchProducts,
} from "@/features/catalog/queries";
import { getSessionUser } from "@/lib/auth/session";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { normalizeSearchQuery } from "@/lib/validations/search";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { locale } = await params;
  const { q, category } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Search");
  const common = await getTranslations("Common");
  const sessionUser = await getSessionUser();
  const query = normalizeSearchQuery(q);

  let products = query ? await searchProducts(query) : [];

  if (category) {
    const result = await getProductsByCategorySlug(category);
    products = result.products;
  }

  const wishlistIds = sessionUser
    ? await getWishlistProductIds(sessionUser.id)
    : new Set<string>();

  const title = query
    ? t("forQuery", { query })
    : category
      ? category
      : t("title");

  const isEmptyQuery = !query && !category;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {isEmptyQuery ? (
          <p className="mt-2 text-muted-foreground">{t("emptyPrompt")}</p>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="doodle-radius-card border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">
            {isEmptyQuery ? t("emptyPromptTitle") : t("emptyTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isEmptyQuery ? t("emptyPrompt") : t("empty")}
          </p>
          <Link href="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
            {common("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              locale={locale}
              product={product}
              signedIn={Boolean(sessionUser)}
              wishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
