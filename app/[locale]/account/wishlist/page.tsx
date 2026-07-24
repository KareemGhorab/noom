import { AccountNav } from "@/components/account/account-nav";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { listWishlistForUser } from "@/features/wishlist/queries";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireSessionUser(locale);
  const items = await listWishlistForUser(user.id);
  const t = await getTranslations("Wishlist");
  const common = await getTranslations("Common");

  return (
    <>
      <AccountNav active="wishlist" />
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
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
              <ProductCard
                key={item.productId}
                locale={locale}
                product={item.product}
                wishlisted
                signedIn
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
