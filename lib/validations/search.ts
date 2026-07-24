import { z } from "zod";

export const searchQuerySchema = z
  .string()
  .trim()
  .max(100, "Search query is too long")
  .transform((value) => value.replace(/\s+/g, " "));

export function normalizeSearchQuery(
  query: string | null | undefined,
): string {
  const parsed = searchQuerySchema.safeParse(query ?? "");
  if (!parsed.success) {
    return "";
  }
  return parsed.data;
}

export function buildSearchTerms(query: string): string[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return [];
  }
  return normalized.split(" ").filter(Boolean);
}
