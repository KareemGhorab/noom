import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { windowStart } from "@/lib/domain/rate-limit";
import { sql } from "drizzle-orm";

export type RateLimitResult = {
  allowed: boolean;
  count: number;
};

/**
 * Atomically increments the counter for `key` in the current fixed window
 * and reports whether the caller is still within `limit`. The upsert with
 * `RETURNING` makes the increment safe under concurrent requests without a
 * separate read-then-write round trip.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const start = new Date(windowStart(Date.now(), windowMs));

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart: start, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;

  return { allowed: count <= limit, count };
}
