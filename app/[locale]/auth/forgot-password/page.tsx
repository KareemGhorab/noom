import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("PasswordReset");

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-bold">{t("requestTitle")}</h1>
        <p className="text-muted-foreground">{t("requestBody")}</p>
      </div>
      {sent ? (
        <p className="doodle-radius-card border bg-card p-4 text-center text-sm">
          {t("sent")}
        </p>
      ) : null}
      <ForgotPasswordForm locale={locale} />
    </div>
  );
}
