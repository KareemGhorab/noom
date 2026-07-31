"use server";

import { signOut } from "@/auth";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import { localePath } from "@/lib/i18n/locale";
import {
  deleteAccountWithEmailSchema,
  deleteAccountWithPasswordSchema,
} from "@/lib/validations/account-delete";
import { changePasswordSchema } from "@/lib/validations/auth";
import { profileUpdateSchema } from "@/lib/validations/profile";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileActionState = {
  ok: boolean;
  code?: ActionErrorCode;
  saved?: boolean;
};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return actionError("invalidProfile");
  }

  await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, user.id));

  revalidatePath("/", "layout");
  return { ok: true, saved: true };
}

/**
 * JWT sessions cannot be revoked server-side, so changing a password does not
 * sign out other devices. See ADR 0009.
 */
export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return actionError("unauthorized");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return actionError("invalidPassword");
  }

  const record = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
    columns: { id: true, passwordHash: true },
  });

  if (!record?.passwordHash) {
    return actionError("invalidPassword");
  }

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    record.passwordHash,
  );

  if (!matches) {
    return actionError("invalidPassword");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, record.id));

  return { ok: true, saved: true };
}

/**
 * Deletes the user row; FKs cascade wishlist, cart, addresses, reviews, etc.
 * Orders keep `user_id` null via ON DELETE SET NULL. JWT sessions on other
 * devices expire naturally — see ADR 0016.
 */
export async function deleteAccountAction(
  locale: string,
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return actionError("unauthorized");
  }

  const record = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
    columns: { id: true, email: true, passwordHash: true },
  });

  if (!record) {
    return actionError("unauthorized");
  }

  if (record.passwordHash) {
    const parsed = deleteAccountWithPasswordSchema.safeParse({
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return actionError("deleteConfirmRequired");
    }

    const matches = await bcrypt.compare(
      parsed.data.password,
      record.passwordHash,
    );

    if (!matches) {
      return actionError("invalidPassword");
    }
  } else {
    const parsed = deleteAccountWithEmailSchema.safeParse({
      confirmEmail: formData.get("confirmEmail"),
    });

    if (!parsed.success || parsed.data.confirmEmail !== record.email) {
      return actionError("deleteConfirmRequired");
    }
  }

  await db.delete(users).where(eq(users.id, record.id));

  // Clears the local JWT cookie; other devices keep their token until expiry.
  await signOut({ redirect: false });

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/"));
}
