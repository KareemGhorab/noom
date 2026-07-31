"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CATALOG_SORTS, type CatalogSort } from "@/lib/validations/catalog-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function CatalogToolbar({
  sort,
  minPrice,
  maxPrice,
  total,
}: {
  sort: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  total: number;
}) {
  const t = useTranslations("Catalog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushWith(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    // Any filter change invalidates the current offset.
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="doodle-radius-card flex flex-wrap items-end gap-4 border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="sort">{t("sortLabel")}</Label>
        <select
          id="sort"
          value={sort}
          onChange={(event) => pushWith({ sort: event.target.value })}
          className="doodle-radius-input h-9 border bg-transparent px-3 text-sm shadow-xs"
        >
          {CATALOG_SORTS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          pushWith({
            minPrice: String(data.get("minPrice") ?? ""),
            maxPrice: String(data.get("maxPrice") ?? ""),
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="minPrice">{t("minPrice")}</Label>
          <Input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            defaultValue={minPrice ?? ""}
            className="doodle-radius-input w-28"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">{t("maxPrice")}</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={maxPrice ?? ""}
            className="doodle-radius-input w-28"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          {t("apply")}
        </Button>
        {minPrice !== undefined || maxPrice !== undefined ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              pushWith({ minPrice: undefined, maxPrice: undefined })
            }
          >
            {t("clear")}
          </Button>
        ) : null}
      </form>

      <p className="ms-auto text-sm text-muted-foreground">
        {t("resultCount", { count: total })}
      </p>
    </div>
  );
}
