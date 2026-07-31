"use client";

import { Button } from "@/components/ui/button";
import { reportReviewAction } from "@/features/reviews/actions";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function ReportReviewButton({
  reviewId,
  signedIn,
}: {
  reviewId: string;
  signedIn: boolean;
}) {
  const t = useTranslations("Reviews");
  const tErrors = useTranslations("Errors");
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!signedIn) return null;

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending || reported}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await reportReviewAction(reviewId);
            if (!result.ok) {
              setError(tErrors(result.code ?? "unknown"));
              return;
            }
            setReported(true);
          });
        }}
      >
        {t("report")}
      </Button>
      {reported ? (
        <p className="text-xs text-muted-foreground" role="status">
          {t("reportSubmitted")}
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
