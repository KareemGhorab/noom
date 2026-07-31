"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction, type AuthActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { ok: true };

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const boundAction = registerAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required className="doodle-radius-input" />
      </div>
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
          minLength={8}
          className="doodle-radius-input"
        />
      </div>
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("registerButton")}
      </Button>
      <p className="text-sm">
        {t("haveAccount")}{" "}
        <Link href="/auth/login" className="underline">
          {t("loginButton")}
        </Link>
      </p>
    </form>
  );
}
