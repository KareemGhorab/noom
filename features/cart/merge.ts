import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts } from "@/lib/db/schema";
import { getGuestId, clearGuestId } from "@/lib/cart/guest";
import { findCartByOwner } from "@/features/cart/queries";

export async function mergeGuestCartIntoUserCart(userId: string) {
  const guestId = await getGuestId();
  if (!guestId) {
    return;
  }

  const guestCart = await findCartByOwner(undefined, guestId);
  if (!guestCart || guestCart.items.length === 0) {
    await clearGuestId();
    return;
  }

  let userCart = await findCartByOwner(userId);
  if (!userCart) {
    const [created] = await db
      .insert(carts)
      .values({ userId })
      .returning();
    userCart = { ...created, items: [] };
  }

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (item) => item.productId === guestItem.productId,
    );

    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + guestItem.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId: userCart.id,
        productId: guestItem.productId,
        quantity: guestItem.quantity,
      });
    }
  }

  await db.delete(carts).where(eq(carts.id, guestCart.id));
  await clearGuestId();
}
