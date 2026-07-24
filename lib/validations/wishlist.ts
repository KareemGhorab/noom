import { z } from "zod";

export const wishlistToggleSchema = z.object({
  productId: z.string().uuid(),
});

export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>;
