import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Reads verification status straight from the database rather than the JWT
 * session, since the session can be up to a day stale (`updateAge`) and a
 * shopper who just verified should see the banner disappear immediately.
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { emailVerified: true },
  });

  return Boolean(user?.emailVerified);
}
