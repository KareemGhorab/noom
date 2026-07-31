/**
 * Server actions return a code, never a sentence. The client resolves it
 * against the `Errors` namespace so an Arabic shopper never sees an English
 * failure message.
 */
export const ACTION_ERROR_CODES = [
  "addressNotFound",
  "alreadyReported",
  "alreadySubscribed",
  "cartItemNotFound",
  "deleteConfirmRequired",
  "discountExpired",
  "discountMinNotMet",
  "emailNotVerified",
  "emptyCart",
  "emptyWishlist",
  "invalidAddress",
  "invalidCartItem",
  "invalidCheckoutDetails",
  "invalidCredentials",
  "invalidDiscount",
  "invalidEmail",
  "invalidEmailVerification",
  "invalidLogin",
  "invalidMagicLink",
  "invalidPassword",
  "invalidPasswordReset",
  "invalidProfile",
  "invalidQuantity",
  "invalidRegistration",
  "invalidReview",
  "itemsUnavailable",
  "notEnoughStock",
  "orderLookupFailed",
  "orderNotCancellable",
  "orderNotFound",
  "priceUnavailable",
  "productNotFound",
  "productUnavailable",
  "reorderUnavailable",
  "reviewNotFound",
  "reviewRequiresPurchase",
  "signInRequired",
  "tooManyRequests",
  "unauthorized",
  "unknown",
  "variantInStock",
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; code: ActionErrorCode };

export function actionError(code: ActionErrorCode): { ok: false; code: ActionErrorCode } {
  return { ok: false, code };
}
