import { AccountNav } from "@/components/account/account-nav";
import { AddressList } from "@/components/account/address-list";
import { listAddressesForUser } from "@/features/addresses/queries";
import { requireSessionUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Addresses" });

  return { title: t("title"), description: t("subtitle") };
}

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireSessionUser(locale);
  const addresses = await listAddressesForUser(user.id);
  const t = await getTranslations("Addresses");

  return (
    <>
      <AccountNav active="addresses" />
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddressList
          addresses={addresses.map((address) => ({
            id: address.id,
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            addressLine: address.addressLine,
            city: address.city,
            isDefault: address.isDefault,
          }))}
        />
      </div>
    </>
  );
}
