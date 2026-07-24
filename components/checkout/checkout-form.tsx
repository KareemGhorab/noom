"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  placeOrderAction,
  type CheckoutActionState,
} from "@/features/checkout/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CheckoutActionState = { ok: true };

export function CheckoutForm({ locale }: { locale: string }) {
  const t = useTranslations("Checkout");
  const boundAction = placeOrderAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required className="doodle-radius-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" required className="doodle-radius-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine">{t("addressLine")}</Label>
        <Input
          id="addressLine"
          name="addressLine"
          required
          className="doodle-radius-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">{t("city")}</Label>
        <Input id="city" name="city" required className="doodle-radius-input" />
      </div>
      {!state.ok && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "..." : t("placeOrder")}
      </Button>
    </form>
  );
}
