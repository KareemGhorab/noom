import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getProductsByCategorySlug,
  searchProducts,
} from "@/features/catalog/queries";
import { normalizeSearchQuery } from "@/lib/validations/search";
import { ProductCard } from "@/components/catalog/product-card";

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
  const query = normalizeSearchQuery(q);

  let products = query ? await searchProducts(query) : [];

  if (category) {
    const result = await getProductsByCategorySlug(category);
    products = result.products;
  }

  const title = query
    ? t("forQuery", { query })
    : category
      ? category
      : t("title");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {!query && !category ? (
          <p className="mt-2 text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">{common("noResults")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} locale={locale} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
