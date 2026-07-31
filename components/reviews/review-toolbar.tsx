"use client";

import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  REVIEW_SORTS,
  type ReviewSort,
} from "@/lib/validations/review";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function ReviewToolbar({ sort }: { sort: ReviewSort }) {
  const t = useTranslations("Reviews");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="review-sort">{t("sortLabel")}</Label>
        <select
          id="review-sort"
          value={sort}
          onChange={(event) => {
            const next = new URLSearchParams(searchParams.toString());
            const value = event.target.value;
            if (value === "newest") {
              next.delete("sort");
            } else {
              next.set("sort", value);
            }
            next.delete("page");
            const query = next.toString();
            router.push(query ? `${pathname}?${query}` : pathname);
          }}
          className="doodle-radius-input h-9 border bg-transparent px-3 text-sm shadow-xs"
        >
          {REVIEW_SORTS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
