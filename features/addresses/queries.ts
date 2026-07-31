import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function listAddressesForUser(userId: string) {
  return db.query.addresses.findMany({
    where: eq(addresses.userId, userId),
    orderBy: [desc(addresses.isDefault), asc(addresses.label)],
  });
}
