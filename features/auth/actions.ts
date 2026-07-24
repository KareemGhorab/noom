"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import {
  loginSchema,
  magicLinkSchema,
  registerSchema,
} from "@/lib/validations/auth";

export type AuthActionState = {
  ok: boolean;
  message?: string;
};

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
    return { ok: false, message: "Invalid registration details" };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existing) {
    return { ok: false, message: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });

  redirect(`/${locale}/auth/login?registered=1`);
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
    return { ok: false, message: "Invalid login details" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: `/${locale}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password" };
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
    return { ok: false, message: "Invalid email address" };
  }

  let user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        name: parsed.data.email.split("@")[0],
      })
      .returning();
    user = created;
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 15);

  await db.delete(verificationTokens).where(
    eq(verificationTokens.identifier, parsed.data.email),
  );

  await db.insert(verificationTokens).values({
    identifier: parsed.data.email,
    token,
    expires,
  });

  const verifyUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(parsed.data.email)}&locale=${locale}`;

  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    console.log(`[noom] Magic link email would be sent to ${parsed.data.email}`);
    console.log(`[noom] Magic link: ${verifyUrl}`);
  } else {
    console.log(`[noom] Magic link for ${parsed.data.email}: ${verifyUrl}`);
  }

  redirect(`/${locale}/auth/magic-link/sent`);
}
