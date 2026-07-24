import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts } from "@/lib/db/schema";
import { ensureGuestId, getGuestId } from "@/lib/cart/guest";
import { auth } from "@/auth";

export async function getCurrentCartId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });

    if (existing) {
      return existing.id;
    }

    const [created] = await db
      .insert(carts)
      .values({ userId })
      .returning({ id: carts.id });

    return created.id;
  }

  const guestId = await ensureGuestId();
  const existing = await db.query.carts.findFirst({
    where: eq(carts.guestId, guestId),
  });

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(carts)
    .values({ guestId })
    .returning({ id: carts.id });

  return created.id;
}

export async function getCartWithItems() {
  const session = await auth();
  const userId = session?.user?.id;
  const guestId = userId ? undefined : await getGuestId();

  if (!userId && !guestId) {
    return { cart: null, items: [] };
  }

  const cart = await db.query.carts.findFirst({
    where: userId
      ? eq(carts.userId, userId)
      : eq(carts.guestId, guestId!),
    with: {
      items: {
        with: {
          product: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  });

  return {
    cart: cart ?? null,
    items: cart?.items ?? [],
  };
}

export async function getCartItemCount(): Promise<number> {
  const { items } = await getCartWithItems();
  return items.reduce((count, item) => count + item.quantity, 0);
}

export async function findCartByOwner(userId?: string, guestId?: string) {
  if (userId) {
    return db.query.carts.findFirst({
      where: eq(carts.userId, userId),
      with: { items: true },
    });
  }

  if (guestId) {
    return db.query.carts.findFirst({
      where: eq(carts.guestId, guestId),
      with: { items: true },
    });
  }

  return undefined;
}

export async function deleteCart(cartId: string) {
  await db.delete(carts).where(eq(carts.id, cartId));
}

export async function clearCartItems(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

export async function findCartItem(cartId: string, productId: string) {
  return db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.productId, productId),
    ),
  });
}
