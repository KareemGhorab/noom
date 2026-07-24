"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, products } from "@/lib/db/schema";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart";
import {
  findCartItem,
  getCurrentCartId,
} from "@/features/cart/queries";

export type ActionState = {
  ok: boolean;
  message?: string;
};

export async function addToCartAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: Number(formData.get("quantity") ?? 1),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid cart item" };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
  });

  if (!product || product.stock < parsed.data.quantity) {
    return { ok: false, message: "Product unavailable" };
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, parsed.data.productId);

  if (existing) {
    const nextQuantity = existing.quantity + parsed.data.quantity;
    if (nextQuantity > product.stock || nextQuantity > 99) {
      return { ok: false, message: "Not enough stock" };
    }

    await db
      .update(cartItems)
      .set({ quantity: nextQuantity })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      cartId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateCartItemSchema.safeParse({
    productId: formData.get("productId"),
    quantity: Number(formData.get("quantity")),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid quantity" };
  }

  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, parsed.data.productId);

  if (!existing) {
    return { ok: false, message: "Item not found" };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
  });

  if (!product || product.stock < parsed.data.quantity) {
    return { ok: false, message: "Not enough stock" };
  }

  await db
    .update(cartItems)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItems.id, existing.id));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(productId: string): Promise<ActionState> {
  const cartId = await getCurrentCartId();
  const existing = await findCartItem(cartId, productId);

  if (!existing) {
    return { ok: false, message: "Item not found" };
  }

  await db.delete(cartItems).where(eq(cartItems.id, existing.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
