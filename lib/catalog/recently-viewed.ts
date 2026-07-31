import { isProduction } from "@/lib/env";
import { cookies } from "next/headers";

export const RECENTLY_VIEWED_COOKIE = "noom_recently_viewed";
export const RECENTLY_VIEWED_MAX = 8;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function parseSlugs(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((slug) => slug.trim())
      .filter(Boolean)
      .slice(0, RECENTLY_VIEWED_MAX);
  } catch {
    return [];
  }
}

export async function getRecentlyViewedSlugs(): Promise<string[]> {
  const store = await cookies();
  return parseSlugs(store.get(RECENTLY_VIEWED_COOKIE)?.value);
}

/**
 * Prepends `slug` and trims to `RECENTLY_VIEWED_MAX`. Safe to call from a
 * server action after a PDP view — not from a Server Component render.
 */
export async function trackRecentlyViewed(slug: string): Promise<void> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return;
  }

  const store = await cookies();
  const existing = parseSlugs(store.get(RECENTLY_VIEWED_COOKIE)?.value);
  const next = [
    trimmed,
    ...existing.filter((entry) => entry !== trimmed),
  ].slice(0, RECENTLY_VIEWED_MAX);

  store.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(next), cookieOptions);
}
