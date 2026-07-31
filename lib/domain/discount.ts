import type { ActionErrorCode } from "@/lib/errors";

export type DiscountType = "percent" | "fixed";

export type DiscountInput = {
  type: DiscountType;
  /** Present when `type === "fixed"`. */
  valueCents: number | null;
  /** Present when `type === "percent"` (1–100). */
  percentInt: number | null;
  minSubtotalCents: number | null;
  expiresAt: Date | null;
  usageCap: number | null;
  usageCount: number;
  /** Required for fixed codes; ignored for percent. */
  currency: string | null;
  active: boolean;
};

export type DiscountComputeOk = { ok: true; discountCents: number };
export type DiscountComputeErr = { ok: false; code: ActionErrorCode };
export type DiscountComputeResult = DiscountComputeOk | DiscountComputeErr;

/**
 * Pure discount math + eligibility. Usage increment and DB locks live in the
 * checkout transaction; this only answers "how much off?" for a given cart.
 */
export function computeDiscountAmount(
  discount: DiscountInput,
  subtotalCents: number,
  orderCurrency: string,
  now: Date = new Date(),
): DiscountComputeResult {
  if (!discount.active) {
    return { ok: false, code: "invalidDiscount" };
  }

  if (
    discount.usageCap != null &&
    discount.usageCount >= discount.usageCap
  ) {
    return { ok: false, code: "invalidDiscount" };
  }

  if (discount.expiresAt != null && discount.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: "discountExpired" };
  }

  if (
    discount.minSubtotalCents != null &&
    subtotalCents < discount.minSubtotalCents
  ) {
    return { ok: false, code: "discountMinNotMet" };
  }

  if (discount.type === "percent") {
    const percent = discount.percentInt;
    if (percent == null || percent <= 0 || percent > 100) {
      return { ok: false, code: "invalidDiscount" };
    }

    const discountCents = Math.floor((subtotalCents * percent) / 100);
    return { ok: true, discountCents: Math.min(discountCents, subtotalCents) };
  }

  if (discount.type === "fixed") {
    if (discount.valueCents == null || discount.valueCents <= 0) {
      return { ok: false, code: "invalidDiscount" };
    }

    if (
      !discount.currency ||
      discount.currency.toUpperCase() !== orderCurrency.toUpperCase()
    ) {
      return { ok: false, code: "invalidDiscount" };
    }

    return {
      ok: true,
      discountCents: Math.min(discount.valueCents, subtotalCents),
    };
  }

  return { ok: false, code: "invalidDiscount" };
}

export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase();
}
