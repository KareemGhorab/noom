import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { normalizeEmail } from "@/lib/validations/auth";
import { parseUuid } from "@/lib/validations/id";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("PasswordReset");

  // The token is only checked against its hash when the form is submitted, so
  // this page never reveals whether a link is still valid.
  const normalizedEmail = normalizeEmail(email);
  const normalizedToken = parseUuid(token);

  if (!normalizedEmail || !normalizedToken) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="font-display text-3xl font-bold">{t("invalidTitle")}</h1>
        <p className="text-muted-foreground">{t("invalidBody")}</p>
        <Link href="/auth/forgot-password" className={buttonVariants()}>
          {t("requestButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-bold">{t("resetTitle")}</h1>
        <p className="text-muted-foreground">{t("resetBody")}</p>
      </div>
      <ResetPasswordForm
        locale={locale}
        email={normalizedEmail}
        token={normalizedToken}
      />
    </div>
  );
}
