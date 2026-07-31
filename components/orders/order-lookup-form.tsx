"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  lookupOrderAction,
  type OrderLookupActionState,
} from "@/features/orders/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: OrderLookupActionState = { ok: true };

export function OrderLookupForm({ locale }: { locale: string }) {
  const t = useTranslations("OrderLookup");
  const tErrors = useTranslations("Errors");
  const boundAction = lookupOrderAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="doodle-radius-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="orderId">{t("orderId")}</Label>
        <Input
          id="orderId"
          name="orderId"
          required
          autoComplete="off"
          spellCheck={false}
          className="doodle-radius-input font-mono"
        />
      </div>
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">
          {state.code === "orderLookupFailed"
            ? t("notFound")
            : tErrors(state.code)}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
