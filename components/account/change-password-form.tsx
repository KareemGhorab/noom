"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    changePasswordAction,
    type ProfileActionState,
} from "@/features/account/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: ProfileActionState = { ok: true };

export function ChangePasswordForm() {
  const t = useTranslations("Account");
  const common = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="doodle-radius-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="doodle-radius-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="doodle-radius-input"
        />
      </div>

      {state.saved ? (
        <p className="text-sm text-muted-foreground">
          {t("passwordChanged")}
        </p>
      ) : null}
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("sessionNotice")}</p>

      <Button type="submit" disabled={pending}>
        {pending ? common("loading") : t("changePassword")}
      </Button>
    </form>
  );
}
