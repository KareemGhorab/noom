"use client";

import { Button } from "@/components/ui/button";
import {
  addAllWishlistToCartAction,
  addWishlistItemToCartAction,
  type WishlistActionState,
} from "@/features/wishlist/actions";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function WishlistAddAllButton() {
  const t = useTranslations("Wishlist");
  const tErrors = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<WishlistActionState | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setState(await addAllWishlistToCartAction());
          });
        }}
      >
        {pending ? "..." : t("addAllToCart")}
      </Button>
      {state?.ok && state.added != null ? (
        <p className="text-sm text-muted-foreground">
          {state.skipped
            ? t("addPartial", {
                added: state.added,
                skipped: state.skipped,
              })
            : t("addedToCart")}
        </p>
      ) : null}
      {state && !state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
    </div>
  );
}

export function WishlistAddItemButton({ productId }: { productId: string }) {
  const t = useTranslations("Wishlist");
  const tErrors = useTranslations("Errors");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<WishlistActionState | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setState(await addWishlistItemToCartAction(productId));
          });
        }}
      >
        {pending ? "..." : t("addToCart")}
      </Button>
      {state?.ok ? (
        <p className="text-xs text-muted-foreground">{t("addedToCart")}</p>
      ) : null}
      {state && !state.ok && state.code ? (
        <p className="text-xs text-destructive">{tErrors(state.code)}</p>
      ) : null}
    </div>
  );
}
