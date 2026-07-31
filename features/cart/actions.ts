"use server";

import {
  findCartItem,
  getCurrentCartId,
  getVariantPriceCents,
} from "@/features/cart/queries";
import { getActiveCurrency } from "@/lib/currency/preference";
import { db } from "@/lib/db";
import { cartItems, productVariants } from "@/lib/db/schema";
import { cartQuantityCap } from "@/lib/domain/cart";
import { hasSufficientStock } from "@/lib/domain/order";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  ok: boolean;
  code?: ActionErrorCode;
};

export async function addToCartAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addToCartSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: Number(formData.get("quantity") ?? 1),
  });

  if (!parsed.success) {
    return actionError("invalidCartItem");
  }

  const currency = await getActiveCurrency();
  const priceCents = await getVariantPriceCents(
    parsed.data.variantId,
    currency,
  );

  if (priceCents == null) {
    return actionError("priceUnavailable");
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
  });

  if (!variant || !hasSufficientStock(variant.stock, parsed.data.quantity)) {
    return actionError("productUnavailable");
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, parsed.data.variantId);
  const cap = cartQuantityCap(variant.stock);

  if ((existing?.quantity ?? 0) + parsed.data.quantity > cap) {
    return actionError("notEnoughStock");
  }

  // Atomic increment bounded by the cap, so concurrent adds cannot combine
  // into a line the checkout would reject.
  await db
    .insert(cartItems)
    .values({
      cartId,
      variantId: parsed.data.variantId,
      quantity: parsed.data.quantity,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: {
        quantity: sql`least(${cartItems.quantity} + ${parsed.data.quantity}, ${cap})`,
      },
    });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateCartItemSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: Number(formData.get("quantity")),
  });

  if (!parsed.success) {
    return actionError("invalidQuantity");
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, parsed.data.variantId);

  if (!existing) {
    return actionError("cartItemNotFound");
  }

  const currency = await getActiveCurrency();
  const priceCents = await getVariantPriceCents(
    parsed.data.variantId,
    currency,
  );

  if (priceCents == null) {
    return actionError("priceUnavailable");
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
  });

  if (!variant || !hasSufficientStock(variant.stock, parsed.data.quantity)) {
    return actionError("notEnoughStock");
  }

  await db
    .update(cartItems)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItems.id, existing.id));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(
  variantId: string,
): Promise<ActionState> {
  const parsed = removeCartItemSchema.safeParse({ variantId });

  if (!parsed.success) {
    return actionError("invalidCartItem");
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, parsed.data.variantId);

  if (!existing) {
    return actionError("cartItemNotFound");
  }

  await db.delete(cartItems).where(eq(cartItems.id, existing.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
