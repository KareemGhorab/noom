import { emailSchema, passwordSchema } from "@/lib/validations/auth";
import { z } from "zod";

/**
 * Password holders confirm with their password; magic-link-only accounts
 * re-type their email so a stolen session cannot delete without that check.
 */
export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmEmail: emailSchema.optional(),
});

export const deleteAccountWithPasswordSchema = z.object({
  password: passwordSchema,
});

export const deleteAccountWithEmailSchema = z.object({
  confirmEmail: emailSchema,
});
