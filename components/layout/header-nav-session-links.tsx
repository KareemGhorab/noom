import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";

/**
 * Split out of `SiteHeader` so the static shell (brand, search) can stream
 * immediately while this session-dependent slice resolves separately.
 */
export async function HeaderNavSessionLinks() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return null;
  }

  const headerT = await getTranslations("Header");

  return (
    <>
      <Link
        href="/account/orders"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {headerT("orders")}
      </Link>
      <Link
        href="/account/wishlist"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {headerT("wishlist")}
      </Link>
    </>
  );
}
