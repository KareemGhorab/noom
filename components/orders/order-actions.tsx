"use client";

import { Button } from "@/components/ui/button";
import {
    cancelOrderAction,
    reorderAction,
} from "@/features/orders/actions";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type Feedback = { tone: "ok" | "error"; text: string };

export function OrderActions({
  orderId,
  cancellable,
}: {
  orderId: string;
  cancellable: boolean;
}) {
  const t = useTranslations("Orders");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setFeedback(null);
            startTransition(async () => {
              const result = await reorderAction(orderId);

              if (!result.ok) {
                setFeedback({
                  tone: "error",
                  text: tErrors(result.code ?? "unknown"),
                });
                return;
              }

              setFeedback({
                tone: "ok",
                text: result.skipped
                  ? t("reorderPartial", {
                      added: result.added ?? 0,
                      skipped: result.skipped,
                    })
                  : t("reorderSuccess", { added: result.added ?? 0 }),
              });
              router.refresh();
            });
          }}
        >
          {t("reorder")}
        </Button>

        {cancellable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setFeedback(null);
              startTransition(async () => {
                const result = await cancelOrderAction(orderId);

                if (!result.ok) {
                  setFeedback({
                    tone: "error",
                    text: tErrors(result.code ?? "unknown"),
                  });
                  return;
                }

                setFeedback({ tone: "ok", text: t("cancelSuccess") });
                router.refresh();
              });
            }}
          >
            {t("cancel")}
          </Button>
        ) : null}
      </div>

      {feedback ? (
        <p
          className={
            feedback.tone === "ok"
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
