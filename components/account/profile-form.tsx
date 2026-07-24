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

const initialState: ProfileActionState = { ok: false };

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useTranslations("Account");
  const common = useTranslations("Common");
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
      {state.message ? (
        <p
          className={
            state.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"
          }
        >
          {state.ok ? t("saved") : t("saveError")}
        </p>
      ) : null}
    </form>
  );
}
