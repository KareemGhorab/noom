"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addToCartAction, type ActionState } from "@/features/cart/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { ok: true };

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Common");
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <Button
        type="submit"
        className="w-full"
        disabled={disabled || pending}
      >
        {pending ? t("loading") : t("addToCart")}
      </Button>
      {!state.ok && state.message ? (
        <p className="mt-2 text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
