import { z } from "zod";

/**
 * `user.email` is a case-sensitive text column, so anything that reaches it
 * must be lowercased first or the same address can register twice.
 */
export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export function normalizeEmail(value: unknown): string | null {
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const magicLinkConsumeSchema = z.object({
  email: emailSchema,
  token: z.string().uuid(),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: z.string().uuid(),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: z.string().uuid(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((value) => value.password !== value.currentPassword, {
    path: ["password"],
    message: "Choose a different password",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type MagicLinkConsumeInput = z.infer<typeof magicLinkConsumeSchema>;
