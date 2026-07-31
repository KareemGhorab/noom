"use client";

import { Button } from "@/components/ui/button";
import { deleteReviewAction } from "@/features/reviews/actions";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function DeleteReviewButton({ productId }: { productId: string }) {
  const t = useTranslations("Reviews");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await deleteReviewAction(productId);

            if (!result.ok) {
              setError(tErrors(result.code ?? "unknown"));
              return;
            }

            router.refresh();
          });
        }}
      >
        {t("delete")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
