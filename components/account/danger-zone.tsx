"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAccountAction,
  type ProfileActionState,
} from "@/features/account/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: ProfileActionState = { ok: true };

export function DangerZone({
  locale,
  hasPassword,
}: {
  locale: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("Account");
  const tErrors = useTranslations("Errors");
  const bound = deleteAccountAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(bound, initialState);

  return (
    <div className="doodle-radius-card mt-6 space-y-4 border border-destructive/40 bg-card p-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-destructive">
          {t("deleteAccount")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("deleteAccountSubtitle")}</p>
        <p className="mt-1 text-sm text-destructive">{t("deleteWarning")}</p>
      </div>

      <form action={formAction} className="space-y-4">
        {hasPassword ? (
          <div className="space-y-2">
            <Label htmlFor="delete-password">{t("deletePassword")}</Label>
            <Input
              id="delete-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="doodle-radius-input"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="delete-email">{t("deleteConfirmEmail")}</Label>
            <Input
              id="delete-email"
              name="confirmEmail"
              type="email"
              required
              autoComplete="email"
              className="doodle-radius-input"
            />
          </div>
        )}

        {!state.ok && state.code ? (
          <p className="text-sm text-destructive">{tErrors(state.code)}</p>
        ) : null}

        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "..." : t("deleteButton")}
        </Button>
      </form>
    </div>
  );
}
