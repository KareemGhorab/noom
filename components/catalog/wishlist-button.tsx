"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function WishlistButton({
  productId,
  initialWishlisted,
  signedIn,
}: {
  productId: string;
  initialWishlisted: boolean;
  signedIn: boolean;
}) {
  const t = useTranslations("Wishlist");
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href="/auth/login"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <Heart className="size-4" />
        {t("signInToSave")}
      </Link>
    );
  }

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant={wishlisted ? "secondary" : "outline"}
        className="w-full"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleWishlistAction(productId);
            if (!result.ok) {
              setError(result.message ?? t("error"));
              return;
            }
            setWishlisted(Boolean(result.wishlisted));
          });
        }}
      >
        <Heart
          className="size-4"
          fill={wishlisted ? "currentColor" : "none"}
        />
        {wishlisted ? t("remove") : t("add")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
