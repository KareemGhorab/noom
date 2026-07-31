"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    saveReviewAction,
    type ReviewActionState,
} from "@/features/reviews/actions";
import { MAX_RATING, MIN_RATING } from "@/lib/validations/review";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: ReviewActionState = { ok: true };

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing?: { rating: number; title: string | null; body: string };
}) {
  const t = useTranslations("Reviews");
  const common = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(
    saveReviewAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("ratingLabel")}</legend>
        <div className="flex gap-4">
          {Array.from(
            { length: MAX_RATING - MIN_RATING + 1 },
            (_, index) => MIN_RATING + index,
          ).map((rating) => (
            <label key={rating} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="rating"
                value={rating}
                required
                defaultChecked={(existing?.rating ?? 0) === rating}
                className="size-4"
              />
              {t("stars", { count: rating })}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="review-title">{t("titleLabel")}</Label>
        <Input
          id="review-title"
          name="title"
          maxLength={100}
          defaultValue={existing?.title ?? ""}
          className="doodle-radius-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">{t("bodyLabel")}</Label>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          defaultValue={existing?.body ?? ""}
        />
      </div>

      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      {state.saved ? (
        <p className="text-sm text-muted-foreground">{t("saved")}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? common("loading") : existing ? t("update") : t("submit")}
      </Button>
    </form>
  );
}
