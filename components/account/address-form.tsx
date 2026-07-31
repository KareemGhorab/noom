"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    createAddressAction,
    updateAddressAction,
    type AddressActionState,
} from "@/features/addresses/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: AddressActionState = { ok: true };

export type AddressFormValues = {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
};

export function AddressForm({
  address,
  onDone,
}: {
  address?: AddressFormValues;
  onDone?: () => void;
}) {
  const t = useTranslations("Addresses");
  const common = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const editing = Boolean(address?.id);
  const [state, formAction, pending] = useActionState(
    editing ? updateAddressAction : createAddressAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {address?.id ? (
        <input type="hidden" name="id" value={address.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="label">{t("label")}</Label>
          <Input
            id="label"
            name="label"
            required
            minLength={2}
            maxLength={40}
            defaultValue={address?.label ?? ""}
            className="doodle-radius-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            defaultValue={address?.fullName ?? ""}
            className="doodle-radius-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            required
            defaultValue={address?.phone ?? ""}
            className="doodle-radius-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t("city")}</Label>
          <Input
            id="city"
            name="city"
            required
            defaultValue={address?.city ?? ""}
            className="doodle-radius-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine">{t("addressLine")}</Label>
        <Input
          id="addressLine"
          name="addressLine"
          required
          defaultValue={address?.addressLine ?? ""}
          className="doodle-radius-input"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="size-4"
        />
        {t("makeDefault")}
      </label>

      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      {state.saved ? (
        <p className="text-sm text-muted-foreground">{t("saved")}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? common("loading") : t("save")}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
