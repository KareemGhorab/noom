"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orderItems, orders, products } from "@/lib/db/schema";
import { calculateOrderTotal } from "@/lib/domain/order";
import { checkoutSchema } from "@/lib/validations/checkout";
import {
  clearCartItems,
  getCartWithItems,
} from "@/features/cart/queries";

export type CheckoutActionState = {
  ok: boolean;
  message?: string;
  orderId?: string;
};

export async function placeOrderAction(
  locale: string,
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid checkout details" };
  }

  const { cart, items } = await getCartWithItems();

  if (!cart || items.length === 0) {
    return { ok: false, message: "Cart is empty" };
  }

  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
    });

    if (!product || product.stock < item.quantity) {
      return { ok: false, message: "Some items are no longer available" };
    }
  }

  const lineItems = items.map((item) => ({
    priceCents: item.product.priceCents,
    quantity: item.quantity,
  }));

  const totalCents = calculateOrderTotal(lineItems);
  const session = await auth();

  const [order] = await db
    .insert(orders)
    .values({
      userId: session?.user?.id,
      status: "placed",
      customerName: parsed.data.name,
      phone: parsed.data.phone,
      addressLine: parsed.data.addressLine,
      city: parsed.data.city,
      totalCents,
      currency: items[0]?.product.currency ?? "AED",
    })
    .returning();

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      titleEn: item.product.titleEn,
      titleAr: item.product.titleAr,
      priceCents: item.product.priceCents,
      quantity: item.quantity,
      imageUrl: item.product.imageUrl,
    })),
  );

  for (const item of items) {
    await db
      .update(products)
      .set({ stock: item.product.stock - item.quantity })
      .where(eq(products.id, item.productId));
  }

  await clearCartItems(cart.id);

  redirect(`/${locale}/checkout/confirmation/${order.id}`);
}

export async function getOrderById(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
}
