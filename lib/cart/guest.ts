import { isProduction } from "@/lib/env";
import { cookies } from "next/headers";

export const GUEST_CART_COOKIE = "noom_guest_id";

export const cartCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
} as const;

export async function getGuestId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_CART_COOKIE)?.value;
}

export async function ensureGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const guestId = crypto.randomUUID();
  cookieStore.set(GUEST_CART_COOKIE, guestId, cartCookieOptions);
  return guestId;
}

export async function clearGuestId() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_CART_COOKIE);
}
