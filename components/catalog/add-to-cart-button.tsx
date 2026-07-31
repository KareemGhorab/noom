"use client";

import { Button } from "@/components/ui/button";
import { addToCartAction, type ActionState } from "@/features/cart/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: ActionState = { ok: true };

export function AddToCartButton({
  variantId,
  disabled,
}: {
  variantId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="quantity" value="1" />
      <Button
        type="submit"
        className="w-full"
        disabled={disabled || pending}
      >
        {pending ? t("loading") : t("addToCart")}
      </Button>
      {!state.ok && state.code ? (
        <p className="mt-2 text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
    </form>
  );
}
