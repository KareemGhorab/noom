export type AddressLike = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
  createdAt: Date;
};

export type CheckoutDefaults = {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
};

export function pickDefaultAddress<T extends AddressLike>(
  addresses: T[],
): T | null {
  if (addresses.length === 0) {
    return null;
  }

  const flagged = addresses.filter((address) => address.isDefault);
  const pool = flagged.length > 0 ? flagged : addresses;

  return pool.reduce((newest, address) =>
    address.createdAt > newest.createdAt ? address : newest,
  );
}

export function toCheckoutDefaults(
  address: Pick<AddressLike, "fullName" | "phone" | "addressLine" | "city">,
): CheckoutDefaults {
  return {
    name: address.fullName,
    phone: address.phone,
    addressLine: address.addressLine,
    city: address.city,
  };
}

export const emptyCheckoutDefaults: CheckoutDefaults = {
  name: "",
  phone: "",
  addressLine: "",
  city: "",
};
