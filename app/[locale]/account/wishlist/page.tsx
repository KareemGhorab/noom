import { AccountNav } from "@/components/account/account-nav";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  WishlistAddAllButton,
  WishlistAddItemButton,
} from "@/components/wishlist/wishlist-cart-actions";
import { getRatingSummaries } from "@/features/reviews/queries";
import { listWishlistForUser } from "@/features/wishlist/queries";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { getActiveCurrency } from "@/lib/currency/preference";
import { cn } from "@/lib/utils";
import { parsePageQuery } from "@/lib/validations/pagination";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function WishlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const rawParams = await searchParams;
  setRequestLocale(locale);

  const user = await requireSessionUser(locale);
  const page = parsePageQuery(rawParams);
  const currency = await getActiveCurrency();
  const { items, pageCount } = await listWishlistForUser(
    user.id,
    currency,
    page,
  );
  const ratings = await getRatingSummaries(
    items.map((item) => item.productId),
  );
  const t = await getTranslations("Wishlist");
  const common = await getTranslations("Common");

  return (
    <>
      <AccountNav active="wishlist" />
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
          </div>
          {items.length > 0 ? <WishlistAddAllButton /> : null}
        </div>

        {items.length === 0 ? (
          <div className="doodle-radius-card border bg-card p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">
              {t("emptyTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
            <Link
              href="/"
              className={cn(buttonVariants(), "mt-6 inline-flex")}
            >
              {common("continueShopping")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.productId} className="space-y-3">
                <ProductCard
                  locale={locale}
                  currency={currency}
                  product={item.product}
                  wishlistState={{ wishlisted: true, signedIn: true }}
                  rating={ratings.get(item.productId)}
                />
                <WishlistAddItemButton productId={item.productId} />
              </div>
            ))}
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("pageOf", { page, pageCount })}
            </p>
            <Pagination
              page={page}
              pageCount={pageCount}
              searchParams={rawParams}
              basePath="/account/wishlist"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
