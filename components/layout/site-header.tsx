import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { getCartItemCount } from "@/features/cart/queries";
import { signOutAction } from "@/features/auth/sign-out";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchForm } from "@/components/layout/search-form";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

export async function SiteHeader() {
  const t = await getTranslations("Common");
  const headerT = await getTranslations("Header");
  const session = await auth();
  const cartCount = await getCartItemCount();

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-2xl font-bold">
            {t("brand")}
          </Link>
          <nav className="hidden md:block">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {headerT("home")}
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <SearchForm />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "relative",
            )}
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">{headerT("cart")}</span>
            {cartCount > 0 ? (
              <Badge className="absolute -top-2 -end-2 size-5 justify-center rounded-full p-0 text-[10px]">
                {cartCount}
              </Badge>
            ) : null}
          </Link>
          {session?.user ? (
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="sm">
                {t("signOut")}
              </Button>
            </form>
          ) : (
            <Link href="/auth/login" className={buttonVariants({ size: "sm" })}>
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
