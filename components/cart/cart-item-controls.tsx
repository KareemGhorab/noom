"use client";

import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  removeCartItemAction,
  updateCartItemAction,
  type ActionState,
} from "@/features/cart/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { ok: true };

export function CartItemControls({
  productId,
  quantity,
  maxQuantity,
}: {
  productId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const t = useTranslations("Common");
  const [state, formAction, pending] = useActionState(
    updateCartItemAction,
    initialState,
  );
  const [isRemoving, startRemove] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <label className="text-sm text-muted-foreground" htmlFor={`qty-${productId}`}>
          {t("quantity")}
        </label>
        <Input
          id={`qty-${productId}`}
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
            await removeCartItemAction(productId);
          })
        }
      >
        {t("remove")}
      </Button>
      {!state.ok && state.message ? (
        <p className="w-full text-sm text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
}
