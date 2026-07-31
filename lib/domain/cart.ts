export const MAX_CART_ITEM_QUANTITY = 99;

/**
 * Both the add-to-cart path and the guest cart merge have to agree on the
 * ceiling for a line item, otherwise signing in can build a cart that checkout
 * then refuses.
 */
export function cartQuantityCap(stock: number): number {
  return Math.max(0, Math.min(stock, MAX_CART_ITEM_QUANTITY));
}

export function clampCartQuantity(requested: number, stock: number): number {
  if (!Number.isFinite(requested) || requested <= 0) {
    return 0;
  }

  return Math.min(Math.floor(requested), cartQuantityCap(stock));
}
