"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction, type AuthActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { ok: true };

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const boundAction = loginAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required className="doodle-radius-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          className="doodle-radius-input"
        />
      </div>
      {!state.ok ? (
        <p className="text-sm text-destructive">{state.message ?? t("invalidCredentials")}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("loginButton")}
      </Button>
      <p className="text-sm text-muted-foreground">{t("demoHint")}</p>
      <p className="text-sm">
        {t("needAccount")}{" "}
        <Link href="/auth/register" className="underline">
          {t("registerButton")}
        </Link>
      </p>
      <p className="text-sm">
        <Link href="/auth/magic-link" className="underline">
          {t("useMagicLink")}
        </Link>
      </p>
    </form>
  );
}
