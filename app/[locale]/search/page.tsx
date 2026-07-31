import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    findProducts,
    getLocalizedCategoryName,
} from "@/features/catalog/queries";
import { getRatingSummaries } from "@/features/reviews/queries";
import { Link } from "@/i18n/navigation";
import { getActiveCurrency } from "@/lib/currency/preference";
import { cn } from "@/lib/utils";
import { parseCatalogQuery } from "@/lib/validations/catalog-query";
import { isSearchQueryRejected } from "@/lib/validations/search";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  perPage?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("searchTitle"), description: t("searchDescription") };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const rawParams = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Search");
  const catalog = await getTranslations("Catalog");
  const common = await getTranslations("Common");

  const query = parseCatalogQuery(rawParams);
  const rejectedQuery = isSearchQueryRejected(rawParams.q);
  const currency = await getActiveCurrency();
  const result = await findProducts(query, currency);

  if (result.categoryMissing) {
    notFound();
  }

  const ratings = await getRatingSummaries(
    result.items.map((product) => product.id),
  );

  const title = query.q
    ? t("forQuery", { query: query.q })
    : result.category
      ? getLocalizedCategoryName(result.category, locale)
      : t("title");

  const browsingEverything = !query.q && !query.category;
  const filtered =
    query.minPrice !== undefined || query.maxPrice !== undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {rejectedQuery ? (
          <p className="mt-2 text-sm text-destructive">{t("queryRejected")}</p>
        ) : browsingEverything && !filtered ? (
          <p className="mt-2 text-muted-foreground">{t("emptyPrompt")}</p>
        ) : null}
      </div>

      <CatalogToolbar
        sort={query.sort}
        minPrice={query.minPrice}
        maxPrice={query.maxPrice}
        total={result.total}
      />

      {result.items.length === 0 ? (
        <div className="doodle-radius-card border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {rejectedQuery ? t("queryRejected") : t("empty")}
          </p>
          <Link href="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
            {common("continueShopping")}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((product) => (
              <ProductCard
                key={product.id}
                locale={locale}
                currency={currency}
                product={product}
                rating={ratings.get(product.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {catalog("pageOf", {
                page: result.page,
                pageCount: result.pageCount,
              })}
            </p>
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              searchParams={rawParams}
            />
          </div>
        </>
      )}
    </div>
  );
}
