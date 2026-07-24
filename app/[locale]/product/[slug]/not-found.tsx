import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function ProductNotFound() {
  const t = await getTranslations("Product");
  const common = await getTranslations("Common");

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="font-display text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundBody")}</p>
      <Link href="/" className={buttonVariants()}>
        {common("backHome")}
      </Link>
    </div>
  );
}
