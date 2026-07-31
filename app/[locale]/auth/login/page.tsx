import { LoginForm } from "@/components/auth/login-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    registered?: string;
    error?: string;
    reset?: string;
    verified?: string;
  }>;
}) {
  const { locale } = await params;
  const { registered, error, reset, verified } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const passwordReset = await getTranslations("PasswordReset");
  const emailVerification = await getTranslations("EmailVerification");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("loginTitle")}</h1>
      {registered ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm">
          {t("registered")}
        </p>
      ) : null}
      {reset ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm">
          {passwordReset("done")}
        </p>
      ) : null}
      {verified ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm">
          {emailVerification("verified")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {t("invalidCredentials")}
        </p>
      ) : null}
      <LoginForm locale={locale} />
    </div>
  );
}
