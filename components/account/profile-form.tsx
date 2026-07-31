"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    updateProfileAction,
    type ProfileActionState,
} from "@/features/account/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: ProfileActionState = { ok: true };

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useTranslations("Account");
  const common = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={100}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? common("loading") : t("save")}
      </Button>
      {state.saved ? (
        <p className="text-sm text-muted-foreground">{t("saved")}</p>
      ) : null}
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
    </form>
  );
}
