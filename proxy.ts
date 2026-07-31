import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension,
  // so an unprefixed path like /cart still redirects to /en/cart.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
