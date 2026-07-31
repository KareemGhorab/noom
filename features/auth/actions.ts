"use server";

import { signIn } from "@/auth";
import { isEmailVerified } from "@/features/auth/queries";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
    passwordResetTokens,
    users,
    verificationTokens,
} from "@/lib/db/schema";
import { sendMail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { localePath, resolveLocale } from "@/lib/i18n/locale";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { RATE_LIMITS } from "@/lib/rate-limit/limits";
import { getClientIp } from "@/lib/request/client-ip";
import {
    loginSchema,
    magicLinkConsumeSchema,
    magicLinkSchema,
    registerSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type AuthActionState = {
  ok: boolean;
  code?: ActionErrorCode;
};

const MAGIC_LINK_TTL_MS = 1000 * 60 * 15;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30;
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

// Verification tokens share the `verificationToken` table with the
// magic-link provider but live under a distinct identifier, so requesting
// one never invalidates the other for the same address.
function verificationIdentifier(email: string) {
  return `verify-email:${email}`;
}

async function sendVerificationEmail(email: string, locale: string) {
  const token = crypto.randomUUID();
  const identifier = verificationIdentifier(email);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  await db.insert(verificationTokens).values({
    identifier,
    token,
    expires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  const verifyUrl = `${env.AUTH_URL}${localePath(
    locale,
    "/auth/verify-email",
  )}?token=${token}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: email,
    subject: "Verify your Noom email",
    text: "Use the link below to verify your email address. It expires in 24 hours.",
    sensitiveUrl: verifyUrl,
  });
}

/**
 * Keys on IP plus the (already normalized) email so a flood aimed at one
 * address from many IPs cannot exhaust a single global counter and lock the
 * real owner out from their own network.
 */
async function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  email: string,
): Promise<AuthActionState | null> {
  const ip = await getClientIp();
  const { limit, windowMs } = RATE_LIMITS[action];
  const { allowed } = await consumeRateLimit(
    `${action}:${ip}:${email}`,
    limit,
    windowMs,
  );

  return allowed ? null : actionError("tooManyRequests");
}

export async function registerAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError("invalidRegistration");
  }

  const limited = await checkRateLimit("register", parsed.data.email);
  if (limited) {
    return limited;
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  // Succeeding silently on a taken address keeps this endpoint from confirming
  // which emails are registered.
  if (!existing) {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      })
      .onConflictDoNothing({ target: users.email });

    await sendVerificationEmail(parsed.data.email, resolveLocale(locale));
  }

  redirect(localePath(locale, "/auth/login?registered=1"));
}

export async function loginAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError("invalidLogin");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: localePath(locale, "/"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Only failed attempts count against the limit, so a shopper who signs
      // in correctly several times in a row (as the shared demo account
      // does) is never penalized — only repeated wrong-password guesses are.
      const limited = await checkRateLimit("login", parsed.data.email);
      return limited ?? actionError("invalidCredentials");
    }
    throw error;
  }

  return { ok: true };
}

export async function requestMagicLinkAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return actionError("invalidEmail");
  }

  const email = parsed.data.email;

  const limited = await checkRateLimit("magicLinkRequest", email);
  if (limited) {
    return limited;
  }

  const safeLocale = resolveLocale(locale);
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  // No user row is created here. The account is provisioned only after the
  // token is proven, so an address cannot be squatted by whoever types it.
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  const verifyUrl = `${env.AUTH_URL}${localePath(
    safeLocale,
    "/auth/magic-link/verify",
  )}?token=${token}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: email,
    subject: "Your Noom sign-in link",
    text: "Use the link below to sign in. It expires in 15 minutes.",
    sensitiveUrl: verifyUrl,
  });

  redirect(localePath(safeLocale, "/auth/magic-link/sent"));
}

export async function confirmMagicLinkAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkConsumeSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return actionError("invalidMagicLink");
  }

  const limited = await checkRateLimit("magicLinkConfirm", parsed.data.email);
  if (limited) {
    return limited;
  }

  try {
    await signIn("magic-link", {
      email: parsed.data.email,
      token: parsed.data.token,
      redirectTo: localePath(locale, "/"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return actionError("invalidMagicLink");
    }
    throw error;
  }

  return { ok: true };
}

export async function requestPasswordResetAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return actionError("invalidEmail");
  }

  const email = parsed.data.email;

  const limited = await checkRateLimit("passwordResetRequest", email);
  if (limited) {
    return limited;
  }

  const safeLocale = resolveLocale(locale);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Only a real account gets a link, but the response is identical either way
  // so the form cannot be used to enumerate addresses.
  if (user?.passwordHash) {
    const token = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(token, 12);

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.identifier, email));

    await db.insert(passwordResetTokens).values({
      identifier: email,
      tokenHash,
      expires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    const resetUrl = `${env.AUTH_URL}${localePath(
      safeLocale,
      "/auth/reset-password",
    )}?token=${token}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: "Reset your Noom password",
      text: "Use the link below to choose a new password. It expires in 30 minutes.",
      sensitiveUrl: resetUrl,
    });
  }

  redirect(localePath(safeLocale, "/auth/forgot-password?sent=1"));
}

export async function resetPasswordAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return actionError("invalidPasswordReset");
  }

  const { email, token, password } = parsed.data;

  const limited = await checkRateLimit("passwordResetConfirm", email);
  if (limited) {
    return limited;
  }

  // Claim atomically, then verify the hash against what was claimed.
  const claimed = await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.identifier, email))
    .returning();

  const now = new Date();
  let matched = false;

  for (const record of claimed) {
    if (record.expires < now) {
      continue;
    }
    if (await bcrypt.compare(token, record.tokenHash)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    return actionError("invalidPasswordReset");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email))
    .returning({ id: users.id });

  if (updated.length === 0) {
    return actionError("invalidPasswordReset");
  }

  redirect(localePath(locale, "/auth/login?reset=1"));
}

export async function isMagicLinkTokenPending(email: string, token: string) {
  const parsed = magicLinkConsumeSchema.safeParse({ email, token });
  if (!parsed.success) {
    return false;
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, parsed.data.email),
      eq(verificationTokens.token, parsed.data.token),
    ),
  });

  return Boolean(record && record.expires >= new Date());
}

export async function isEmailVerificationTokenPending(
  email: string,
  token: string,
) {
  const parsed = verifyEmailSchema.safeParse({ email, token });
  if (!parsed.success) {
    return false;
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, verificationIdentifier(parsed.data.email)),
      eq(verificationTokens.token, parsed.data.token),
    ),
  });

  return Boolean(record && record.expires >= new Date());
}

export async function confirmEmailVerificationAction(
  locale: string,
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return actionError("invalidEmailVerification");
  }

  const { email, token } = parsed.data;

  // Claim atomically, matching both identifier and token, so a wrong guess
  // cannot burn the real token before the shopper uses it.
  const [claimed] = await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, verificationIdentifier(email)),
        eq(verificationTokens.token, token),
      ),
    )
    .returning();

  if (!claimed || claimed.expires < new Date()) {
    return actionError("invalidEmailVerification");
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  redirect(localePath(locale, "/auth/login?verified=1"));
}

export async function resendVerificationEmailAction(
  locale: string,
): Promise<AuthActionState> {
  const user = await getSessionUser();
  if (!user?.email) {
    return actionError("signInRequired");
  }

  const limited = await checkRateLimit("verifyEmailResend", user.email);
  if (limited) {
    return limited;
  }

  // Already verified (e.g. a stale banner from another tab) — nothing to do.
  if (await isEmailVerified(user.id)) {
    return { ok: true };
  }

  await sendVerificationEmail(user.email, resolveLocale(locale));
  return { ok: true };
}
