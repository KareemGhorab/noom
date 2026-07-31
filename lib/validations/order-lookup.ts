import { emailSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const orderLookupSchema = z.object({
  email: emailSchema,
  orderId: z.string().trim().uuid(),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;
