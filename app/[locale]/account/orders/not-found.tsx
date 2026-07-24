import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function OrderNotFound() {
  const t = await getTranslations("Orders");
  const common = await getTranslations("Common");

  return (
    <div className="doodle-radius-card mx-auto max-w-lg border bg-card p-8 text-center">
      <h1 className="font-display text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("notFoundBody")}</p>
      <Link
        href="/account/orders"
        className={cn(buttonVariants(), "mt-6 inline-flex")}
      >
        {t("backToOrders")}
      </Link>
      <div className="mt-3">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {common("backHome")}
        </Link>
      </div>
    </div>
  );
}
