"use server";

import { getCurrentCartId } from "@/features/cart/queries";
import { notifyStockSubscribers } from "@/features/stock/notify";
import { getSessionUser } from "@/lib/auth/session";
import { getGuestId } from "@/lib/cart/guest";
import { getActiveCurrency } from "@/lib/currency/preference";
import { db } from "@/lib/db";
import {
  cartItems,
  orders,
  productVariants,
  variantPrices,
} from "@/lib/db/schema";
import { clampCartQuantity } from "@/lib/domain/cart";
import { canCancelOrder } from "@/lib/domain/orders-access";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { localePath } from "@/lib/i18n/locale";
import { rememberOrderForConfirmation } from "@/lib/orders/confirmation-cookie";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { RATE_LIMITS } from "@/lib/rate-limit/limits";
import { getClientIp } from "@/lib/request/client-ip";
import { parseUuid } from "@/lib/validations/id";
import { orderLookupSchema } from "@/lib/validations/order-lookup";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OrderActionState = {
  ok: boolean;
  code?: ActionErrorCode;
};

export type ReorderActionState = OrderActionState & {
  added?: number;
  skipped?: number;
};

export type OrderLookupActionState = OrderActionState;

/**
 * Guests who lost the confirmation cookie can recover a read-only view by
 * proving they know both the order id and the email captured at checkout.
 * Failures are always `orderLookupFailed` so neither field is enumerable.
 */
export async function lookupOrderAction(
  locale: string,
  _prev: OrderLookupActionState,
  formData: FormData,
): Promise<OrderLookupActionState> {
  const parsed = orderLookupSchema.safeParse({
    email: formData.get("email"),
    orderId: formData.get("orderId"),
  });

  if (!parsed.success) {
    return actionError("orderLookupFailed");
  }

  const { email, orderId } = parsed.data;
  const ip = await getClientIp();
  const { limit, windowMs } = RATE_LIMITS.orderLookup;
  const { allowed } = await consumeRateLimit(
    `orderLookup:${ip}:${email}`,
    limit,
    windowMs,
  );

  if (!allowed) {
    return actionError("tooManyRequests");
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, email: true },
  });

  if (!order?.email || order.email.toLowerCase() !== email) {
    return actionError("orderLookupFailed");
  }

  await rememberOrderForConfirmation(order.id);
  redirect(localePath(locale, `/checkout/confirmation/${order.id}`));
}

export async function cancelOrderAction(
  orderId: string,
): Promise<OrderActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const id = parseUuid(orderId);
  if (!id) {
    return actionError("orderNotFound");
  }

  const restoredVariantIds: string[] = [];

  try {
    await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, id),
        with: { items: true },
      });

      if (!order) {
        throw new OrderActionError("orderNotFound");
      }

      if (
        !canCancelOrder({
          status: order.status,
          orderUserId: order.userId,
          viewerUserId: user.id,
        })
      ) {
        throw new OrderActionError("orderNotCancellable");
      }

      // Conditional update, so two concurrent cancels cannot both restore
      // stock for the same order.
      const cancelled = await tx
        .update(orders)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(and(eq(orders.id, order.id), eq(orders.status, "placed")))
        .returning({ id: orders.id });

      if (cancelled.length === 0) {
        throw new OrderActionError("orderNotCancellable");
      }

      for (const item of order.items) {
        if (!item.variantId) {
          continue;
        }

        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));

        restoredVariantIds.push(item.variantId);
      }
    });
  } catch (error) {
    if (error instanceof OrderActionError) {
      return actionError(error.code);
    }
    throw error;
  }

  // Outside the transaction: mail must not roll back a successful cancel.
  await notifyStockSubscribers(restoredVariantIds);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderAction(
  orderId: string,
): Promise<ReorderActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const id = parseUuid(orderId);
  if (!id) {
    return actionError("orderNotFound");
  }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    with: { items: true },
  });

  if (!order) {
    return actionError("orderNotFound");
  }

  const wanted = new Map<string, number>();
  let skipped = 0;

  for (const item of order.items) {
    if (!item.variantId) {
      skipped += 1;
      continue;
    }
    wanted.set(
      item.variantId,
      (wanted.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  if (wanted.size === 0) {
    return { ok: false, code: "reorderUnavailable", added: 0, skipped };
  }

  const cartId = await getCurrentCartId();
  const currency = await getActiveCurrency();
  let added = 0;

  await db.transaction(async (tx) => {
    const stockRows = await tx
      .select({ id: productVariants.id, stock: productVariants.stock })
      .from(productVariants)
      .where(inArray(productVariants.id, [...wanted.keys()]));

    const pricedRows = await tx
      .select({ variantId: variantPrices.variantId })
      .from(variantPrices)
      .where(
        and(
          inArray(variantPrices.variantId, [...wanted.keys()]),
          eq(variantPrices.currency, currency),
        ),
      );

    const stockById = new Map(stockRows.map((row) => [row.id, row.stock]));
    const pricedIds = new Set(pricedRows.map((row) => row.variantId));

    for (const [variantId, quantity] of wanted) {
      const stock = stockById.get(variantId);

      if (stock === undefined || !pricedIds.has(variantId)) {
        skipped += 1;
        continue;
      }

      const existing = await tx.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.variantId, variantId),
        ),
      });

      const merged = clampCartQuantity(
        (existing?.quantity ?? 0) + quantity,
        stock,
      );

      if (merged <= 0 || merged === existing?.quantity) {
        skipped += 1;
        continue;
      }

      await tx
        .insert(cartItems)
        .values({ cartId, variantId, quantity: merged })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity: merged },
        });

      added += 1;
    }
  });

  revalidatePath("/", "layout");

  if (added === 0) {
    return { ok: false, code: "reorderUnavailable", added, skipped };
  }

  return { ok: true, added, skipped };
}

/**
 * Attaches orders placed before sign-in to the account. Matching on the guest
 * cookie rather than the email keeps this reliable without asking the shopper
 * for anything.
 */
export async function claimGuestOrders(userId: string) {
  const guestId = await getGuestId();
  if (!guestId) {
    return;
  }

  await db
    .update(orders)
    .set({ userId, guestId: null })
    .where(and(eq(orders.guestId, guestId), isNull(orders.userId)));
}

class OrderActionError extends Error {
  constructor(readonly code: ActionErrorCode) {
    super(code);
    this.name = "OrderActionError";
  }
}
