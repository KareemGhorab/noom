import { getTranslations, setRequestLocale } from "next-intl/server";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export default async function MagicLinkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("magicLinkTitle")}</h1>
      <MagicLinkForm locale={locale} />
    </div>
  );
}
