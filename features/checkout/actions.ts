"use server";

import { auth } from "@/auth";
import { isEmailVerified } from "@/features/auth/queries";
import { getCartWithItems } from "@/features/cart/queries";
import { getGuestId } from "@/lib/cart/guest";
import { getActiveCurrency } from "@/lib/currency/preference";
import { db } from "@/lib/db";
import {
  addresses,
  cartItems,
  discounts,
  orderItems,
  orders,
  productVariants,
} from "@/lib/db/schema";
import { formatOptionSummary } from "@/lib/domain/catalog";
import {
  computeDiscountAmount,
  normalizeDiscountCode,
} from "@/lib/domain/discount";
import {
  calculateOrderTotal,
  hasSufficientStock,
} from "@/lib/domain/order";
import { priceInCurrency } from "@/lib/domain/pricing";
import { sendMail } from "@/lib/email/send";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { localePath } from "@/lib/i18n/locale";
import { rememberOrderForConfirmation } from "@/lib/orders/confirmation-cookie";
import { normalizeEmail } from "@/lib/validations/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CheckoutActionState = {
  ok: boolean;
  code?: ActionErrorCode;
};

/** Signals a deliberate rollback rather than an unexpected failure. */
class CheckoutError extends Error {
  constructor(
    readonly reason:
      | "unavailable"
      | "priceUnavailable"
      | ActionErrorCode,
  ) {
    super(reason);
    this.name = "CheckoutError";
  }
}

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
    discountCode: formData.get("discountCode"),
  });

  if (!parsed.success) {
    return actionError("invalidCheckoutDetails");
  }

  const { cart, items } = await getCartWithItems();

  if (!cart || items.length === 0) {
    return actionError("emptyCart");
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Guests have no verification concept; only signed-in shoppers are gated.
  if (userId && !(await isEmailVerified(userId))) {
    return actionError("emailNotVerified");
  }

  // Guests must leave an email so they can look the order up later; signed-in
  // shoppers reuse the account address already on the session.
  const email = userId
    ? (session?.user?.email?.toLowerCase() ?? null)
    : normalizeEmail(formData.get("email"));

  if (!userId && !email) {
    return actionError("invalidCheckoutDetails");
  }

  const guestId = userId ? undefined : await getGuestId();
  const saveAddress = formData.get("saveAddress") === "on";
  const currency = await getActiveCurrency();
  const discountCode = parsed.data.discountCode
    ? normalizeDiscountCode(parsed.data.discountCode)
    : undefined;

  let orderId: string;

  try {
    orderId = await db.transaction(async (tx) => {
      const variantIds = items.map((item) => item.variantId);

      // One read for every line, and the source of truth for price and stock:
      // the cart join was loaded before validation and may be stale.
      const rows = await tx.query.productVariants.findMany({
        where: inArray(productVariants.id, variantIds),
        with: {
          prices: true,
          product: {
            with: { options: true },
          },
        },
      });

      const byId = new Map(rows.map((variant) => [variant.id, variant]));

      for (const item of items) {
        const variant = byId.get(item.variantId);
        if (!variant || !hasSufficientStock(variant.stock, item.quantity)) {
          throw new CheckoutError("unavailable");
        }

        if (priceInCurrency(variant.prices, currency) == null) {
          throw new CheckoutError("priceUnavailable");
        }
      }

      const lines = items.map((item) => {
        const variant = byId.get(item.variantId)!;
        const priceCents = priceInCurrency(variant.prices, currency)!;
        return { variant, quantity: item.quantity, priceCents };
      });

      const subtotalCents = calculateOrderTotal(
        lines.map((line) => ({
          priceCents: line.priceCents,
          quantity: line.quantity,
        })),
      );

      let discountCents: number | null = null;
      let appliedCode: string | null = null;

      if (discountCode) {
        const now = new Date();
        const existing = await tx.query.discounts.findFirst({
          where: eq(discounts.code, discountCode),
        });

        if (!existing) {
          throw new CheckoutError("invalidDiscount");
        }

        const computed = computeDiscountAmount(
          existing,
          subtotalCents,
          currency,
          now,
        );

        if (!computed.ok) {
          throw new CheckoutError(computed.code);
        }

        // Conditional increment so a concurrent checkout cannot push a code
        // past its usage cap after the pure helper already said it was free.
        const [claimed] = await tx
          .update(discounts)
          .set({ usageCount: sql`${discounts.usageCount} + 1` })
          .where(
            and(
              eq(discounts.id, existing.id),
              eq(discounts.active, true),
              or(isNull(discounts.expiresAt), gte(discounts.expiresAt, now)),
              or(
                isNull(discounts.usageCap),
                lt(discounts.usageCount, discounts.usageCap),
              ),
            ),
          )
          .returning({ id: discounts.id, code: discounts.code });

        if (!claimed) {
          throw new CheckoutError("invalidDiscount");
        }

        discountCents = computed.discountCents;
        appliedCode = claimed.code;
      }

      const totalCents = Math.max(0, subtotalCents - (discountCents ?? 0));

      const [order] = await tx
        .insert(orders)
        .values({
          userId,
          guestId,
          email,
          status: "placed",
          customerName: parsed.data.name,
          phone: parsed.data.phone,
          addressLine: parsed.data.addressLine,
          city: parsed.data.city,
          totalCents,
          currency,
          discountCode: appliedCode,
          discountCents,
        })
        .returning();

      await tx.insert(orderItems).values(
        lines.map((line) => ({
          orderId: order.id,
          variantId: line.variant.id,
          titleEn: line.variant.product.titleEn,
          titleAr: line.variant.product.titleAr,
          optionSummaryEn: formatOptionSummary(
            line.variant.product.options,
            line.variant.optionValues,
            "en",
          ) || null,
          optionSummaryAr: formatOptionSummary(
            line.variant.product.options,
            line.variant.optionValues,
            "ar",
          ) || null,
          priceCents: line.priceCents,
          currency,
          quantity: line.quantity,
          imageUrl: line.variant.imageUrl ?? line.variant.product.imageUrl,
        })),
      );

      for (const line of lines) {
        // Relative decrement guarded by the current value, so a concurrent
        // checkout cannot be overwritten with a stale absolute number.
        const decremented = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${line.quantity}` })
          .where(
            and(
              eq(productVariants.id, line.variant.id),
              gte(productVariants.stock, line.quantity),
            ),
          )
          .returning({ id: productVariants.id });

        if (decremented.length === 0) {
          throw new CheckoutError("unavailable");
        }
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      if (userId && saveAddress) {
        const existing = await tx.query.addresses.findMany({
          where: eq(addresses.userId, userId),
          columns: { id: true },
        });

        await tx.insert(addresses).values({
          userId,
          label: parsed.data.city,
          fullName: parsed.data.name,
          phone: parsed.data.phone,
          addressLine: parsed.data.addressLine,
          city: parsed.data.city,
          isDefault: existing.length === 0,
        });
      }

      return order.id;
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      if (error.reason === "unavailable") {
        return actionError("itemsUnavailable");
      }
      if (error.reason === "priceUnavailable") {
        return actionError("priceUnavailable");
      }
      return actionError(error.reason);
    }
    throw error;
  }

  await rememberOrderForConfirmation(orderId);

  // Outside the transaction on purpose: a mail failure must not roll back a
  // placed order.
  if (email) {
    await sendMail({
      to: email,
      subject: "Your Noom demo order",
      text: `Thanks, ${parsed.data.name}. Your demo order ${orderId} is confirmed. No payment was charged.`,
    });
  }

  revalidatePath("/", "layout");

  redirect(localePath(locale, `/checkout/confirmation/${orderId}`));
}
