import { z } from "zod";

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s()-]+$/, "Invalid phone number format"),
  addressLine: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address is too long"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City name is too long"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
