"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    requestPasswordResetAction,
    type AuthActionState,
} from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: AuthActionState = { ok: true };

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("PasswordReset");
  const auth = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const boundAction = requestPasswordResetAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{auth("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="doodle-radius-input"
        />
      </div>
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("requestButton")}
      </Button>
      <p className="text-sm">
        <Link href="/auth/login" className="underline">
          {auth("loginButton")}
        </Link>
      </p>
    </form>
  );
}
