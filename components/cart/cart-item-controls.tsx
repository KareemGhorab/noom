"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeCartItemAction,
  updateCartItemAction,
  type ActionState,
} from "@/features/cart/actions";
import { useTranslations } from "next-intl";
import { useActionState, useTransition } from "react";

const initialState: ActionState = { ok: true };

export function CartItemControls({
  variantId,
  quantity,
  maxQuantity,
}: {
  variantId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const t = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(
    updateCartItemAction,
    initialState,
  );
  const [isRemoving, startRemove] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="variantId" value={variantId} />
        <label
          className="text-sm text-muted-foreground"
          htmlFor={`qty-${variantId}`}
        >
          {t("quantity")}
        </label>
        <Input
          id={`qty-${variantId}`}
          name="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          defaultValue={quantity}
          className="w-20 doodle-radius-input"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {t("update")}
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isRemoving}
        onClick={() =>
          startRemove(async () => {
            await removeCartItemAction(variantId);
          })
        }
      >
        {t("remove")}
      </Button>
      {!state.ok && state.code ? (
        <p className="w-full text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
    </div>
  );
}
