"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  subscribeBackInStockAction,
  type StockSubscribeState,
} from "@/features/stock/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: StockSubscribeState = { ok: true };

export function BackInStockForm({
  variantId,
  defaultEmail,
}: {
  variantId: string;
  defaultEmail?: string | null;
}) {
  const t = useTranslations("Product");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(
    subscribeBackInStockAction,
    initialState,
  );

  if (state.ok && state.subscribed) {
    return <p className="text-sm text-muted-foreground">{t("notifySuccess")}</p>;
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border p-4">
      <input type="hidden" name="variantId" value={variantId} />
      <div>
        <p className="font-medium">{t("notifyTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("notifyBody")}</p>
      </div>
      {!defaultEmail ? (
        <div className="space-y-2">
          <Label htmlFor="notify-email">{t("notifyEmail")}</Label>
          <Input
            id="notify-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="doodle-radius-input"
          />
        </div>
      ) : (
        <input type="hidden" name="email" value={defaultEmail} />
      )}
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : t("notifySubmit")}
      </Button>
    </form>
  );
}
