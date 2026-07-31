import { WishlistButton } from "@/components/catalog/wishlist-button";
import { Skeleton } from "@/components/ui/skeleton";
import { isProductWishlisted } from "@/features/wishlist/queries";
import { getSessionUser } from "@/lib/auth/session";

export function WishlistHeartSkeleton() {
  return <Skeleton className="h-9 w-full" />;
}

/**
 * Resolves session + wishlist state on its own so `ProductCard` grids don't
 * have to await `auth()` before rendering. Callers that already know the
 * answer (e.g. the wishlist page itself) pass `wishlistState` to `ProductCard`
 * directly instead of mounting this.
 */
export async function WishlistHeart({ productId }: { productId: string }) {
  const sessionUser = await getSessionUser();
  const wishlisted = sessionUser
    ? await isProductWishlisted(sessionUser.id, productId)
    : false;

  return (
    <WishlistButton
      productId={productId}
      initialWishlisted={wishlisted}
      signedIn={Boolean(sessionUser)}
    />
  );
}
