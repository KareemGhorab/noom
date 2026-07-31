import { isProduction } from "@/lib/env";
import { cookies } from "next/headers";

export const LAST_ORDER_COOKIE = "noom_last_order";

/**
 * Guests have no session, so the confirmation page proves ownership with a
 * short-lived cookie written at checkout instead of trusting the order id in
 * the URL.
 */
export async function rememberOrderForConfirmation(orderId: string) {
  const cookieStore = await cookies();
  cookieStore.set(LAST_ORDER_COOKIE, orderId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function getRememberedOrderId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_ORDER_COOKIE)?.value;
}
