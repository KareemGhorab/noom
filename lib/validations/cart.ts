import { z } from "zod";

export const cartItemQuantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(99, "Quantity cannot exceed 99");

export type CartItemQuantity = z.infer<typeof cartItemQuantitySchema>;

export const updateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: cartItemQuantitySchema,
});

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: cartItemQuantitySchema.default(1),
});
