import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { signOutAction } from "@/features/auth/sign-out";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Heart, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Split out of `SiteHeader` so the static shell (brand, search) can stream
 * immediately while this session-dependent slice resolves separately.
 */
export async function HeaderSessionMenu() {
  const sessionUser = await getSessionUser();
  const t = await getTranslations("Common");
  const headerT = await getTranslations("Header");

  if (!sessionUser) {
    return (
      <Link href="/auth/login" className={buttonVariants({ size: "sm" })}>
        {t("signIn")}
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/account/wishlist"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        aria-label={headerT("wishlist")}
      >
        <Heart className="size-4" />
        <span className="hidden sm:inline">{headerT("wishlist")}</span>
      </Link>
      <Link
        href="/account"
        aria-label={t("account")}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
      >
        <UserRound className="size-4" />
        <span className="hidden sm:inline">{t("account")}</span>
      </Link>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="sm">
          {t("signOut")}
        </Button>
      </form>
    </>
  );
}
