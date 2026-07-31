"use client";

import { Button } from "@/components/ui/button";
import { voteReviewHelpfulAction } from "@/features/reviews/actions";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function ReviewHelpfulButton({
  reviewId,
  helpfulCount,
  viewerVoted,
  signedIn,
}: {
  reviewId: string;
  helpfulCount: number;
  viewerVoted: boolean;
  signedIn: boolean;
}) {
  const t = useTranslations("Reviews");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={viewerVoted ? "secondary" : "outline"}
        size="sm"
        disabled={pending || !signedIn}
        aria-pressed={viewerVoted}
        onClick={() => {
          if (!signedIn) return;
          setError(null);
          startTransition(async () => {
            const result = await voteReviewHelpfulAction(reviewId);
            if (!result.ok) {
              setError(tErrors(result.code ?? "unknown"));
              return;
            }
            router.refresh();
          });
        }}
      >
        {t("helpful", { count: helpfulCount })}
      </Button>
      {!signedIn ? (
        <p className="text-xs text-muted-foreground">{t("signInToVote")}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
