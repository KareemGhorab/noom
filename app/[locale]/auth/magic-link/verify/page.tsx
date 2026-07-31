import { MagicLinkConfirmForm } from "@/components/auth/magic-link-confirm-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { isMagicLinkTokenPending } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/locale";
import { normalizeEmail } from "@/lib/validations/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Magic links land on this interstitial instead of consuming the token on GET,
 * so email scanners and link prefetchers cannot burn a single-use token before
 * the shopper clicks.
 */
export default async function MagicLinkVerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const safeLocale = resolveLocale(locale);
  const normalizedEmail = normalizeEmail(email);
  const valid =
    normalizedEmail && token
      ? await isMagicLinkTokenPending(normalizedEmail, token)
      : false;

  if (!valid || !normalizedEmail || !token) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="font-display text-3xl font-bold">
          {t("magicLinkInvalidTitle")}
        </h1>
        <p className="text-muted-foreground">{t("magicLinkInvalidBody")}</p>
        <Link href="/auth/magic-link" className={buttonVariants()}>
          {t("magicLinkButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="font-display text-3xl font-bold">
        {t("magicLinkConfirmTitle")}
      </h1>
      <p className="text-muted-foreground">
        {t("magicLinkConfirmBody", { email: normalizedEmail })}
      </p>
      <MagicLinkConfirmForm
        locale={safeLocale}
        email={normalizedEmail}
        token={token}
      />
    </div>
  );
}
