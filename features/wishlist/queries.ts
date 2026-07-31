import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { priceInCurrency } from "@/lib/domain/pricing";
import type { CurrencyCode } from "@/lib/i18n/currency";
import { WISHLIST_PER_PAGE } from "@/lib/validations/pagination";
import { and, count, desc, eq } from "drizzle-orm";

export async function listWishlistForUser(
  userId: string,
  currency: CurrencyCode,
  page = 1,
  perPage = WISHLIST_PER_PAGE,
) {
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  const pageCount = Math.ceil(total / perPage);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);

  const items = await db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, userId),
    with: {
      product: {
        with: {
          category: true,
          variants: {
            with: {
              prices: true,
            },
          },
          options: true,
        },
      },
    },
    orderBy: [desc(wishlistItems.createdAt)],
    limit: perPage,
    offset: (safePage - 1) * perPage,
  });

  return {
    items: items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        variants: item.product.variants.map((variant) => {
          const { prices, ...rest } = variant;
          return {
            ...rest,
            priceCents: priceInCurrency(prices, currency),
          };
        }),
      },
    })),
    total,
    page: safePage,
    pageCount,
  };
}

export async function isProductWishlisted(userId: string, productId: string) {
  const item = await db.query.wishlistItems.findFirst({
    where: and(
      eq(wishlistItems.userId, userId),
      eq(wishlistItems.productId, productId),
    ),
  });

  return Boolean(item);
}

export async function getWishlistProductIds(userId: string) {
  const items = await db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, userId),
    columns: { productId: true },
  });

  return new Set(items.map((item) => item.productId));
}
