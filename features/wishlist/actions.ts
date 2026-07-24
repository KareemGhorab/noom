"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { products, wishlistItems } from "@/lib/db/schema";
import { wishlistToggleSchema } from "@/lib/validations/wishlist";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WishlistActionState = {
  ok: boolean;
  wishlisted?: boolean;
  message?: string;
};

export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in required" };
  }

  const parsed = wishlistToggleSchema.safeParse({ productId });
  if (!parsed.success) {
    return { ok: false, message: "Invalid product" };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
    columns: { id: true },
  });

  if (!product) {
    return { ok: false, message: "Product not found" };
  }

  const existing = await db.query.wishlistItems.findFirst({
    where: and(
      eq(wishlistItems.userId, user.id),
      eq(wishlistItems.productId, parsed.data.productId),
    ),
  });

  if (existing) {
    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, user.id),
          eq(wishlistItems.productId, parsed.data.productId),
        ),
      );
    revalidatePath("/", "layout");
    return { ok: true, wishlisted: false };
  }

  await db.insert(wishlistItems).values({
    userId: user.id,
    productId: parsed.data.productId,
  });

  revalidatePath("/", "layout");
  return { ok: true, wishlisted: true };
}
