import { routing, type Locale } from "@/i18n/routing";

const supported: readonly string[] = routing.locales;

/**
 * Locale values that reach us from query strings or route params are attacker
 * controlled. Interpolating one into a path builds `//evil.com/...`, which the
 * URL parser treats as an absolute origin, so every locale must be matched
 * against the routing table before it is used in a redirect.
 */
export function resolveLocale(input: unknown): Locale {
  if (typeof input !== "string") {
    return routing.defaultLocale;
  }

  return supported.includes(input) ? (input as Locale) : routing.defaultLocale;
}

export function localePath(locale: unknown, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${resolveLocale(locale)}${normalized}`;
}
