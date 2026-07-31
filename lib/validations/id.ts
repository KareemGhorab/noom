import { z } from "zod";

export const uuidSchema = z.string().uuid();

/**
 * Route params reach Drizzle unparsed otherwise, and Postgres raises
 * `invalid input syntax for type uuid` for a non-uuid segment, which surfaces
 * as a 500 instead of a 404.
 */
export function parseUuid(value: unknown): string | null {
  const parsed = uuidSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
