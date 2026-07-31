import { auth } from "@/auth";
import { ensureGuestId, getGuestId } from "@/lib/cart/guest";
import { getActiveCurrency } from "@/lib/currency/preference";
import { db } from "@/lib/db";
import { cartItems, carts, productVariants } from "@/lib/db/schema";
import { countCartItems } from "@/lib/domain/order";
import { priceInCurrency } from "@/lib/domain/pricing";
import type { CurrencyCode } from "@/lib/i18n/currency";
import { and, eq } from "drizzle-orm";

/**
 * Upsert rather than check-then-insert: two concurrent requests from the same
 * shopper would otherwise create two carts, and every read uses `findFirst`,
 * so the second cart silently swallows items.
 */
export async function getCurrentCartId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const [cart] = await db
      .insert(carts)
      .values({ userId })
      .onConflictDoUpdate({
        target: carts.userId,
        set: { updatedAt: new Date() },
      })
      .returning({ id: carts.id });

    return cart.id;
  }

  const guestId = await ensureGuestId();

  const [cart] = await db
    .insert(carts)
    .values({ guestId })
    .onConflictDoUpdate({
      target: carts.guestId,
      set: { updatedAt: new Date() },
    })
    .returning({ id: carts.id });

  return cart.id;
}

export type CartLine = Awaited<
  ReturnType<typeof getCartWithItems>
>["items"][number];

export async function getCartWithItems() {
  const session = await auth();
  const userId = session?.user?.id;
  const guestId = userId ? undefined : await getGuestId();
  const currency = await getActiveCurrency();

  if (!userId && !guestId) {
    return { cart: null, items: [], currency };
  }

  const cart = await db.query.carts.findFirst({
    where: userId
      ? eq(carts.userId, userId)
      : eq(carts.guestId, guestId!),
    with: {
      items: {
        with: {
          variant: {
            with: {
              prices: true,
              product: {
                with: {
                  category: true,
                  options: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const items =
    cart?.items.map((item) => {
      const { prices, ...variant } = item.variant;
      return {
        ...item,
        variant: {
          ...variant,
          priceCents: priceInCurrency(prices, currency),
        },
      };
    }) ?? [];

  return {
    cart: cart ?? null,
    items,
    currency,
  };
}

export async function getCartItemCount(): Promise<number> {
  const { items } = await getCartWithItems();
  return countCartItems(items);
}

export async function clearCartItems(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

export async function findCartItem(cartId: string, variantId: string) {
  return db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.variantId, variantId),
    ),
  });
}

export async function getVariantPriceCents(
  variantId: string,
  currency: CurrencyCode,
): Promise<number | null> {
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    with: { prices: true },
  });

  if (!variant) {
    return null;
  }

  return priceInCurrency(variant.prices, currency);
}
