"use client";

import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");
  const common = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="font-display text-3xl font-bold">
        {t("boundaryTitle")}
      </h1>
      <p className="text-muted-foreground">{t("boundaryBody")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonVariants()}
        >
          {t("retry")}
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          {common("backHome")}
        </Link>
      </div>
    </div>
  );
}
