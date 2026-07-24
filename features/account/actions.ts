"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/validations/profile";

export type ProfileActionState = {
  ok: boolean;
  message?: string;
};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Unauthorized" };
  }

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid profile details" };
  }

  await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, user.id));

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated" };
}
