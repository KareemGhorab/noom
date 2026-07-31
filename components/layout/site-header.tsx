import { HeaderCartBadge } from "@/components/layout/header-cart-badge";
import { HeaderCurrencySwitcher } from "@/components/layout/header-currency-switcher";
import { HeaderNavSessionLinks } from "@/components/layout/header-nav-session-links";
import { HeaderSessionMenu } from "@/components/layout/header-session-menu";
import {
    HeaderCartBadgeSkeleton,
    HeaderSessionMenuSkeleton,
} from "@/components/layout/header-skeletons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SearchForm } from "@/components/layout/search-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

/**
 * The shell here (brand, static nav, search, theme/language toggles) has no
 * session or cart dependency, so it can render immediately. The currency
 * switcher, session menu, and cart badge are split into Suspense-wrapped
 * children so a slow preference / `auth()` / guest-cart-cookie read never
 * blocks the rest of the header, or the page, from streaming.
 */
export async function SiteHeader() {
  const t = await getTranslations("Common");
  const headerT = await getTranslations("Header");

  return (
    <header className="border-b bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-2xl font-bold">
            {t("brand")}
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {headerT("home")}
            </Link>
            <Link
              href="/orders/lookup"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {headerT("findOrder")}
            </Link>
            <Suspense fallback={null}>
              <HeaderNavSessionLinks />
            </Suspense>
          </nav>
        </div>

        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <SearchForm />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Suspense fallback={null}>
            <HeaderCurrencySwitcher />
          </Suspense>
          <ThemeToggle />
          <Suspense fallback={<HeaderCartBadgeSkeleton />}>
            <HeaderCartBadge />
          </Suspense>
          <Suspense fallback={<HeaderSessionMenuSkeleton />}>
            <HeaderSessionMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
