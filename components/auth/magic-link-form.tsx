"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  requestMagicLinkAction,
  type AuthActionState,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { ok: true };

export function MagicLinkForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const boundAction = requestMagicLinkAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required className="doodle-radius-input" />
      </div>
      {!state.ok ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("magicLinkButton")}
      </Button>
      <p className="text-sm">
        <Link href="/auth/login" className="underline">
          {t("loginButton")}
        </Link>
      </p>
    </form>
  );
}
