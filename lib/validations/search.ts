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

/**
 * `%` and `_` are ILIKE wildcards, so an unescaped `%` matches the whole
 * catalog. Drizzle parameterizes the value, so this is about result scope and
 * query cost rather than injection.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function buildSearchTerms(query: string): string[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return [];
  }
  return normalized
    .split(" ")
    .filter(Boolean)
    .map(escapeLikePattern)
    .filter((term) => term.length > 0);
}

export function isSearchQueryRejected(
  query: string | null | undefined,
): boolean {
  if (!query) {
    return false;
  }

  return searchQuerySchema.safeParse(query).success === false;
}
