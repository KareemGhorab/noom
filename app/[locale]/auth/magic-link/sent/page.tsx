import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function MagicLinkSentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="font-display text-3xl font-bold">{t("magicLinkSentTitle")}</h1>
      <p className="text-muted-foreground">{t("magicLinkSentBody")}</p>
      <Link href="/auth/login" className={buttonVariants()}>
        {t("loginButton")}
      </Link>
    </div>
  );
}
