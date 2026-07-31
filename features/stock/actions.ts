"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productVariants, stockSubscriptions } from "@/lib/db/schema";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { RATE_LIMITS } from "@/lib/rate-limit/limits";
import { getClientIp } from "@/lib/request/client-ip";
import { normalizeEmail } from "@/lib/validations/auth";
import { stockSubscriptionSchema } from "@/lib/validations/stock-subscription";
import { and, eq, isNull } from "drizzle-orm";

export type StockSubscribeState = {
  ok: boolean;
  code?: ActionErrorCode;
  subscribed?: boolean;
};

export async function subscribeBackInStockAction(
  _prev: StockSubscribeState,
  formData: FormData,
): Promise<StockSubscribeState> {
  const session = await auth();
  const sessionEmail = session?.user?.email
    ? normalizeEmail(session.user.email)
    : null;

  const parsed = stockSubscriptionSchema.safeParse({
    variantId: formData.get("variantId"),
    email: formData.get("email") || sessionEmail,
  });

  if (!parsed.success) {
    return actionError("invalidEmail");
  }

  const ip = await getClientIp();
  const { limit, windowMs } = RATE_LIMITS.stockSubscribe;
  const { allowed } = await consumeRateLimit(
    `stockSubscribe:${ip}:${parsed.data.email}`,
    limit,
    windowMs,
  );

  if (!allowed) {
    return actionError("tooManyRequests");
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
    columns: { id: true, stock: true },
  });

  if (!variant) {
    return actionError("productNotFound");
  }

  if (variant.stock > 0) {
    return actionError("variantInStock");
  }

  const existing = await db.query.stockSubscriptions.findFirst({
    where: and(
      eq(stockSubscriptions.email, parsed.data.email),
      eq(stockSubscriptions.variantId, parsed.data.variantId),
      isNull(stockSubscriptions.notifiedAt),
    ),
  });

  if (existing) {
    return actionError("alreadySubscribed");
  }

  await db
    .insert(stockSubscriptions)
    .values({
      email: parsed.data.email,
      variantId: parsed.data.variantId,
    })
    .onConflictDoUpdate({
      target: [stockSubscriptions.email, stockSubscriptions.variantId],
      set: { notifiedAt: null, createdAt: new Date() },
    });

  return { ok: true, subscribed: true };
}
