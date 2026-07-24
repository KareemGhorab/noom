import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { registered, error } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("loginTitle")}</h1>
      {registered ? (
        <p className="rounded-md border border-border bg-muted p-3 text-sm">
          {t("registered")}
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
