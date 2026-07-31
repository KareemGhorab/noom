import { z } from "zod";

// Shared with the address book so a saved address can always satisfy checkout.
export const fullNameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long");

export const phoneField = z
  .string()
  .trim()
  .min(8, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^[+\d\s()-]+$/, "Invalid phone number format");

export const addressLineField = z
  .string()
  .trim()
  .min(5, "Address must be at least 5 characters")
  .max(200, "Address is too long");

export const cityField = z
  .string()
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(100, "City name is too long");

function normalizeOptionalDiscountCode(value: unknown): string | undefined {
  if (value == null || typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed.length === 0 ? undefined : trimmed.slice(0, 40);
}

export const checkoutSchema = z.object({
  name: fullNameField,
  phone: phoneField,
  addressLine: addressLineField,
  city: cityField,
  discountCode: z.preprocess(
    normalizeOptionalDiscountCode,
    z.string().max(40).optional(),
  ),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
