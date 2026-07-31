import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return null;
  }

  const { passwordHash, ...profile } = user;

  // Magic-link and OAuth accounts have no password to change.
  return { ...profile, hasPassword: Boolean(passwordHash) };
}
