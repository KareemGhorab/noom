"use server";

import { auth } from "@/auth";
import {
  getActiveCurrency,
  setCurrencyCookie,
} from "@/lib/currency/preference";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { actionError, type ActionResult } from "@/lib/errors";
import { resolveCurrency, type CurrencyCode } from "@/lib/i18n/currency";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setCurrencyAction(
  rawCurrency: string,
): Promise<ActionResult<{ currency: CurrencyCode }>> {
  const currency = resolveCurrency(rawCurrency);

  // Reject unknown codes rather than silently writing the default — a typo
  // in the switcher should not flip the shopper to AED.
  if (currency !== rawCurrency) {
    return actionError("unknown");
  }

  await setCurrencyCookie(currency);

  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    await db
      .update(users)
      .set({ currency })
      .where(eq(users.id, userId));
  }

  revalidatePath("/", "layout");
  return { ok: true, currency };
}

export async function getCurrencyAction(): Promise<CurrencyCode> {
  return getActiveCurrency();
}
