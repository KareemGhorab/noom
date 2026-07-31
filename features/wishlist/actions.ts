"use server";

import {
  findCartItem,
  getCurrentCartId,
  getVariantPriceCents,
} from "@/features/cart/queries";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveCurrency } from "@/lib/currency/preference";
import { db } from "@/lib/db";
import { cartItems, products, wishlistItems } from "@/lib/db/schema";
import { cartQuantityCap } from "@/lib/domain/cart";
import { hasSufficientStock } from "@/lib/domain/order";
import { priceInCurrency } from "@/lib/domain/pricing";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import type { CurrencyCode } from "@/lib/i18n/currency";
import { parseUuid } from "@/lib/validations/id";
import { wishlistToggleSchema } from "@/lib/validations/wishlist";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WishlistActionState = {
  ok: boolean;
  wishlisted?: boolean;
  code?: ActionErrorCode;
  added?: number;
  skipped?: number;
};

export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const parsed = wishlistToggleSchema.safeParse({ productId });
  if (!parsed.success) {
    return actionError("productNotFound");
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
    columns: { id: true },
  });

  if (!product) {
    return actionError("productNotFound");
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

/**
 * Adds the first in-stock, priced variant of a wishlisted product (default /
 * empty options preferred) to the cart.
 */
export async function addWishlistItemToCartAction(
  productId: string,
): Promise<WishlistActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const id = parseUuid(productId);
  if (!id) {
    return actionError("productNotFound");
  }

  const wishlisted = await db.query.wishlistItems.findFirst({
    where: and(
      eq(wishlistItems.userId, user.id),
      eq(wishlistItems.productId, id),
    ),
  });

  if (!wishlisted) {
    return actionError("productNotFound");
  }

  const currency = await getActiveCurrency();
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: {
        with: { prices: true },
      },
    },
  });

  if (!product) {
    return actionError("productNotFound");
  }

  const variant =
    product.variants.find(
      (entry) =>
        entry.stock > 0 && priceInCurrency(entry.prices, currency) != null,
    ) ?? null;

  if (!variant) {
    return actionError("productUnavailable");
  }

  const added = await addVariantToCart(variant.id, variant.stock, currency);
  if (!added.ok) {
    return added;
  }

  revalidatePath("/", "layout");
  return { ok: true, added: 1, skipped: 0 };
}

export async function addAllWishlistToCartAction(): Promise<WishlistActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("signInRequired");
  }

  const currency = await getActiveCurrency();
  const items = await db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, user.id),
    with: {
      product: {
        with: {
          variants: {
            with: { prices: true },
          },
        },
      },
    },
  });

  if (items.length === 0) {
    return actionError("emptyWishlist");
  }

  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const variant =
      item.product.variants.find(
        (entry) =>
          entry.stock > 0 && priceInCurrency(entry.prices, currency) != null,
      ) ?? null;

    if (!variant) {
      skipped += 1;
      continue;
    }

    const result = await addVariantToCart(
      variant.id,
      variant.stock,
      currency,
    );

    if (result.ok) {
      added += 1;
    } else {
      skipped += 1;
    }
  }

  revalidatePath("/", "layout");

  if (added === 0) {
    return { ok: false, code: "productUnavailable", added, skipped };
  }

  return { ok: true, added, skipped };
}

async function addVariantToCart(
  variantId: string,
  stock: number,
  currency: CurrencyCode,
): Promise<WishlistActionState> {
  const priceCents = await getVariantPriceCents(variantId, currency);
  if (priceCents == null) {
    return actionError("priceUnavailable");
  }

  if (!hasSufficientStock(stock, 1)) {
    return actionError("productUnavailable");
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, variantId);
  const cap = cartQuantityCap(stock);

  if ((existing?.quantity ?? 0) + 1 > cap) {
    return actionError("notEnoughStock");
  }

  await db
    .insert(cartItems)
    .values({
      cartId,
      variantId,
      quantity: 1,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: {
        quantity: sql`least(${cartItems.quantity} + 1, ${cap})`,
      },
    });

  return { ok: true };
}
