import { emailSchema } from "@/lib/validations/auth";
import { uuidSchema } from "@/lib/validations/id";
import { z } from "zod";

export const stockSubscriptionSchema = z.object({
  variantId: uuidSchema,
  email: emailSchema,
});

export type StockSubscriptionInput = z.infer<typeof stockSubscriptionSchema>;
