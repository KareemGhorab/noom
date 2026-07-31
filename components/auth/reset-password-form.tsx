"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    resetPasswordAction,
    type AuthActionState,
} from "@/features/auth/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: AuthActionState = { ok: true };

export function ResetPasswordForm({
  locale,
  email,
  token,
}: {
  locale: string;
  email: string;
  token: string;
}) {
  const t = useTranslations("PasswordReset");
  const account = useTranslations("Account");
  const tErrors = useTranslations("Errors");
  const boundAction = resetPasswordAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4 text-start">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="password">{account("newPassword")}</Label>
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
        <Label htmlFor="confirmPassword">{account("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="doodle-radius-input"
        />
      </div>

      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {t("resetButton")}
      </Button>
    </form>
  );
}
