import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getCategories,
  getFeaturedProducts,
  getLocalizedCategoryName,
} from "@/features/catalog/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const common = await getTranslations("Common");
  const [categories, products] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="space-y-12">
      <section className="doodle-radius-card border bg-card p-8 md:p-12">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {common("brand")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("heroSubtitle")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/search" className={buttonVariants({ size: "lg" })}>
            {common("search")}
          </Link>
          <Link
            href="/cart"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {common("viewCart")}
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">{t("categories")}</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/search?category=${category.slug}`}
              className={buttonVariants({ variant: "secondary" })}
            >
              {getLocalizedCategoryName(category, locale)}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">{t("featured")}</h2>
          <Badge variant="outline">{common("demoCheckoutBanner")}</Badge>
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground">{t("emptyFeatured")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} locale={locale} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
