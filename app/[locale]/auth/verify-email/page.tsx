import { VerifyEmailConfirmForm } from "@/components/auth/verify-email-confirm-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { isEmailVerificationTokenPending } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/locale";
import { normalizeEmail } from "@/lib/validations/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Verification links land on this interstitial instead of consuming the
 * token on GET, so email scanners and link prefetchers cannot burn a
 * single-use token before the shopper clicks.
 */
export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("EmailVerification");
  const common = await getTranslations("Common");
  const safeLocale = resolveLocale(locale);
  const normalizedEmail = normalizeEmail(email);
  const valid =
    normalizedEmail && token
      ? await isEmailVerificationTokenPending(normalizedEmail, token)
      : false;

  if (!valid || !normalizedEmail || !token) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="font-display text-3xl font-bold">
          {t("invalidTitle")}
        </h1>
        <p className="text-muted-foreground">{t("invalidBody")}</p>
        <Link href="/" className={buttonVariants()}>
          {common("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="font-display text-3xl font-bold">{t("confirmTitle")}</h1>
      <p className="text-muted-foreground">
        {t("confirmBody", { email: normalizedEmail })}
      </p>
      <VerifyEmailConfirmForm
        locale={safeLocale}
        email={normalizedEmail}
        token={token}
      />
    </div>
  );
}
