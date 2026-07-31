import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isProduction } from "@/lib/env";
import {
  DEFAULT_CURRENCY,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/i18n/currency";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const CURRENCY_COOKIE = "noom_currency";

export const currencyCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * Resolution order: signed-in `user.currency` → `noom_currency` cookie → AED.
 * See ADR 0013.
 */
export async function getActiveCurrency(): Promise<CurrencyCode> {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { currency: true },
    });

    if (user?.currency) {
      return resolveCurrency(user.currency);
    }
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(CURRENCY_COOKIE)?.value;
  if (fromCookie) {
    return resolveCurrency(fromCookie);
  }

  return DEFAULT_CURRENCY;
}

export async function setCurrencyCookie(currency: CurrencyCode) {
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_COOKIE, currency, currencyCookieOptions);
}
