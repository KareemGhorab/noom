import { clearGuestId, getGuestId } from "@/lib/cart/guest";
import { db } from "@/lib/db";
import { cartItems, carts, productVariants } from "@/lib/db/schema";
import { clampCartQuantity } from "@/lib/domain/cart";
import { and, eq, inArray } from "drizzle-orm";

export async function mergeGuestCartIntoUserCart(userId: string) {
  const guestId = await getGuestId();
  if (!guestId) {
    return;
  }

  await db.transaction(async (tx) => {
    const guestCart = await tx.query.carts.findFirst({
      where: eq(carts.guestId, guestId),
      with: { items: true },
    });

    if (!guestCart) {
      return;
    }

    if (guestCart.items.length === 0) {
      await tx.delete(carts).where(eq(carts.id, guestCart.id));
      return;
    }

    const [userCart] = await tx
      .insert(carts)
      .values({ userId })
      .onConflictDoUpdate({
        target: carts.userId,
        set: { updatedAt: new Date() },
      })
      .returning({ id: carts.id });

    // Collapse first: a guest cart written before the uniqueness constraint
    // existed can hold several rows for one variant.
    const guestQuantities = new Map<string, number>();
    for (const item of guestCart.items) {
      guestQuantities.set(
        item.variantId,
        (guestQuantities.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    const variantIds = [...guestQuantities.keys()];
    const stockRows = await tx
      .select({ id: productVariants.id, stock: productVariants.stock })
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds));

    const stockById = new Map(stockRows.map((row) => [row.id, row.stock]));

    for (const [variantId, guestQuantity] of guestQuantities) {
      const stock = stockById.get(variantId);
      if (stock === undefined) {
        continue;
      }

      const existing = await tx.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.variantId, variantId),
        ),
      });

      const merged = clampCartQuantity(
        (existing?.quantity ?? 0) + guestQuantity,
        stock,
      );

      if (merged <= 0) {
        if (existing) {
          await tx.delete(cartItems).where(eq(cartItems.id, existing.id));
        }
        continue;
      }

      await tx
        .insert(cartItems)
        .values({ cartId: userCart.id, variantId, quantity: merged })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity: merged },
        });
    }

    await tx.delete(carts).where(eq(carts.id, guestCart.id));
  });

  await clearGuestId();
}
