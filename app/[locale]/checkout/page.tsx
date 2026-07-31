import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Badge } from "@/components/ui/badge";
import { listAddressesForUser } from "@/features/addresses/queries";
import { getCartWithItems } from "@/features/cart/queries";
import { getLatestOrderForUser } from "@/features/orders/queries";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
    emptyCheckoutDefaults,
    pickDefaultAddress,
    toCheckoutDefaults,
} from "@/lib/domain/address";
import {
    calculateOrderTotal,
    countCartItems,
    formatPrice,
} from "@/lib/domain/order";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("checkoutTitle"),
    description: t("checkoutDescription"),
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Checkout");
  const cart = await getTranslations("Cart");
  const common = await getTranslations("Common");
  const { items, currency } = await getCartWithItems();

  if (items.length === 0) {
    redirect({ href: "/cart", locale });
  }

  if (items.some((item) => item.variant.priceCents == null)) {
    redirect({ href: "/cart", locale });
  }

  const sessionUser = await getSessionUser();
  const savedAddresses = sessionUser
    ? await listAddressesForUser(sessionUser.id)
    : [];

  const defaultAddress = pickDefaultAddress(savedAddresses);
  const lastOrder = sessionUser
    ? await getLatestOrderForUser(sessionUser.id)
    : null;

  // Prefer a saved address, then the last order, then whatever the profile
  // already knows about the shopper.
  const defaults = defaultAddress
    ? toCheckoutDefaults(defaultAddress)
    : lastOrder
      ? {
          name: lastOrder.customerName,
          phone: lastOrder.phone,
          addressLine: lastOrder.addressLine,
          city: lastOrder.city,
        }
      : { ...emptyCheckoutDefaults, name: sessionUser?.name ?? "" };

  const totalCents = calculateOrderTotal(
    items.map((item) => ({
      priceCents: item.variant.priceCents!,
      quantity: item.quantity,
    })),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <Badge>{common("demoCheckoutBanner")}</Badge>
        </div>
        <CheckoutForm
          locale={locale}
          defaults={defaults}
          signedIn={Boolean(sessionUser)}
          defaultAddressId={defaultAddress?.id ?? null}
          addresses={savedAddresses.map((address) => ({
            id: address.id,
            label: address.label,
            ...toCheckoutDefaults(address),
          }))}
        />
      </div>
      <aside className="doodle-radius-card h-fit space-y-3 border bg-card p-6">
        <p className="text-sm text-muted-foreground">{common("total")}</p>
        <p className="text-3xl font-bold">
          {formatPrice(totalCents, currency, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {cart("itemCount", { count: countCartItems(items) })} ·{" "}
          {common("demoCheckoutBanner")}
        </p>
      </aside>
    </div>
  );
}
