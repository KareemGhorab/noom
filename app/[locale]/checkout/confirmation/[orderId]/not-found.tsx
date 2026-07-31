import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function ConfirmationNotFound() {
  const t = await getTranslations("Confirmation");
  const common = await getTranslations("Common");

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="font-display text-3xl font-bold">{t("notFound")}</h1>
      <Link href="/" className={buttonVariants()}>
        {common("backHome")}
      </Link>
    </div>
  );
}
