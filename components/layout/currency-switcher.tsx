"use client";

import { setCurrencyAction } from "@/features/currency/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CURRENCY_CODES,
  type CurrencyCode,
} from "@/lib/i18n/currency";
import { CircleDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function CurrencySwitcher({
  currency,
}: {
  currency: CurrencyCode;
}) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchCurrency(next: CurrencyCode) {
    if (next === currency || pending) {
      return;
    }

    startTransition(async () => {
      await setCurrencyAction(next);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("currencyLabel")}
          disabled={pending}
        >
          <CircleDollarSign className="size-4" />
          <span className="hidden sm:inline">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {CURRENCY_CODES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchCurrency(code)}
            className={code === currency ? "font-semibold" : undefined}
          >
            {code === "AED" ? t("currencyAed") : t("currencyUsd")}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
