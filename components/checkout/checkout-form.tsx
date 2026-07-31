"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    placeOrderAction,
    type CheckoutActionState,
} from "@/features/checkout/actions";
import type { CheckoutDefaults } from "@/lib/domain/address";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

const initialState: CheckoutActionState = { ok: true };

export type CheckoutAddressOption = CheckoutDefaults & {
  id: string;
  label: string;
};

const NEW_ADDRESS = "new";

export function CheckoutForm({
  locale,
  defaults,
  addresses,
  signedIn,
  defaultAddressId,
}: {
  locale: string;
  defaults: CheckoutDefaults;
  addresses: CheckoutAddressOption[];
  signedIn: boolean;
  defaultAddressId: string | null;
}) {
  const t = useTranslations("Checkout");
  const tErrors = useTranslations("Errors");
  const boundAction = placeOrderAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [selectedId, setSelectedId] = useState(defaultAddressId ?? NEW_ADDRESS);
  const [values, setValues] = useState<CheckoutDefaults>(defaults);

  function applyAddress(id: string) {
    setSelectedId(id);

    if (id === NEW_ADDRESS) {
      setValues({ name: "", phone: "", addressLine: "", city: "" });
      return;
    }

    const match = addresses.find((address) => address.id === id);
    if (match) {
      setValues({
        name: match.name,
        phone: match.phone,
        addressLine: match.addressLine,
        city: match.city,
      });
    }
  }

  function field(key: keyof CheckoutDefaults) {
    return {
      value: values[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setValues((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  return (
    <form action={formAction} className="space-y-4">
      {addresses.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="savedAddress">{t("savedAddress")}</Label>
          <select
            id="savedAddress"
            value={selectedId}
            onChange={(event) => applyAddress(event.target.value)}
            className="doodle-radius-input h-9 w-full border bg-transparent px-3 text-sm shadow-xs"
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label}
              </option>
            ))}
            <option value={NEW_ADDRESS}>{t("newAddress")}</option>
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          required
          className="doodle-radius-input"
          {...field("name")}
        />
      </div>
      {!signedIn ? (
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="doodle-radius-input"
          />
          <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          required
          className="doodle-radius-input"
          {...field("phone")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine">{t("addressLine")}</Label>
        <Input
          id="addressLine"
          name="addressLine"
          required
          className="doodle-radius-input"
          {...field("addressLine")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">{t("city")}</Label>
        <Input
          id="city"
          name="city"
          required
          className="doodle-radius-input"
          {...field("city")}
        />
      </div>

      {signedIn ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="saveAddress" className="size-4" />
          {t("saveAddress")}
        </label>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="discountCode">{t("discountCode")}</Label>
        <Input
          id="discountCode"
          name="discountCode"
          autoComplete="off"
          className="doodle-radius-input"
        />
        <p className="text-xs text-muted-foreground">{t("discountCodeHint")}</p>
      </div>

      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "..." : t("placeOrder")}
      </Button>
    </form>
  );
}
