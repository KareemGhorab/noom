import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { getCartItemCount } from "@/features/cart/queries";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Split out of `SiteHeader` so the static shell (brand, search) can stream
 * immediately while the guest-cart-cookie read resolves separately.
 */
export async function HeaderCartBadge() {
  const headerT = await getTranslations("Header");
  const cartCount = await getCartItemCount();

  return (
    <Link
      href="/cart"
      aria-label={headerT("cart")}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative")}
    >
      <ShoppingCart className="size-4" />
      <span className="hidden sm:inline">{headerT("cart")}</span>
      {cartCount > 0 ? (
        <Badge className="absolute -top-2 -end-2 size-5 justify-center rounded-full p-0 text-[10px]">
          {cartCount}
        </Badge>
      ) : null}
    </Link>
  );
}
