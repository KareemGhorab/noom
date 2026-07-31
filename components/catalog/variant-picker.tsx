"use client";

import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { BackInStockForm } from "@/components/catalog/back-in-stock-form";
import { Button } from "@/components/ui/button";
import { getStockState } from "@/lib/domain/catalog";
import { formatPrice } from "@/lib/domain/order";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export type PickerOption = {
  key: string;
  labelEn: string;
  labelAr: string;
  position: number;
};

export type PickerVariant = {
  id: string;
  priceCents: number | null;
  stock: number;
  optionValues: Record<string, string>;
  imageUrl: string | null;
};

function optionValuesMatch(
  left: Record<string, string>,
  right: Record<string, string>,
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

function valuesForOption(
  variants: readonly PickerVariant[],
  key: string,
): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const variant of variants) {
    const value = variant.optionValues[key];
    if (value && !seen.has(value)) {
      seen.add(value);
      values.push(value);
    }
  }

  return values;
}

export function VariantPicker({
  locale,
  currency,
  options,
  variants,
  sessionEmail,
}: {
  locale: string;
  currency: string;
  options: readonly PickerOption[];
  variants: readonly PickerVariant[];
  sessionEmail?: string | null;
}) {
  const t = useTranslations("Product");
  const common = useTranslations("Common");
  const errors = useTranslations("Errors");

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.position - b.position),
    [options],
  );

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    if (sortedOptions.length === 0) {
      return {};
    }

    const firstPurchasable =
      variants.find(
        (variant) => variant.stock > 0 && variant.priceCents != null,
      ) ??
      variants.find((variant) => variant.priceCents != null) ??
      variants[0];
    return firstPurchasable ? { ...firstPurchasable.optionValues } : {};
  });

  const matchedVariant = useMemo(() => {
    if (sortedOptions.length === 0) {
      return variants[0] ?? null;
    }

    if (sortedOptions.some((option) => !selected[option.key])) {
      return null;
    }

    return (
      variants.find((variant) =>
        optionValuesMatch(variant.optionValues, selected),
      ) ?? null
    );
  }, [selected, sortedOptions, variants]);

  const stockState = matchedVariant
    ? getStockState(matchedVariant.stock)
    : "out";
  const priceMissing =
    matchedVariant != null && matchedVariant.priceCents == null;
  const canPurchase =
    matchedVariant != null &&
    matchedVariant.priceCents != null &&
    matchedVariant.stock > 0;

  return (
    <div className="space-y-4">
      {sortedOptions.map((option) => {
        const label = locale === "ar" ? option.labelAr : option.labelEn;
        const values = valuesForOption(variants, option.key);

        return (
          <fieldset key={option.key} className="space-y-2">
            <legend className="text-sm font-medium">
              {t("chooseOption", { option: label })}
            </legend>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const isActive = selected[option.key] === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    aria-pressed={isActive}
                    onClick={() =>
                      setSelected((current) => ({
                        ...current,
                        [option.key]: value,
                      }))
                    }
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {matchedVariant ? (
        <>
          <p className="text-2xl font-semibold">
            {priceMissing
              ? errors("priceUnavailable")
              : formatPrice(matchedVariant.priceCents!, currency, locale)}
          </p>
          <p
            className={
              stockState === "low"
                ? "font-medium text-destructive"
                : "text-muted-foreground"
            }
          >
            {stockState === "out"
              ? common("outOfStock")
              : stockState === "low"
                ? common("lowStock", { count: matchedVariant.stock })
                : common("inStock")}
          </p>
          <AddToCartButton
            variantId={matchedVariant.id}
            disabled={!canPurchase}
          />
          {stockState === "out" ? (
            <BackInStockForm
              variantId={matchedVariant.id}
              defaultEmail={sessionEmail}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("selectVariant")}</p>
      )}
    </div>
  );
}
