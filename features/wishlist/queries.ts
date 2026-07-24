import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function listWishlistForUser(userId: string) {
  return db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, userId),
    with: {
      product: {
        with: { category: true },
      },
    },
    orderBy: [desc(wishlistItems.createdAt)],
  });
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
