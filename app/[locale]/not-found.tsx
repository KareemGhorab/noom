import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  const common = await getTranslations("Common");

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Link href="/" className={buttonVariants()}>
        {common("backHome")}
      </Link>
    </div>
  );
}
