"use client";

import { Button } from "@/components/ui/button";
import {
    confirmMagicLinkAction,
    type AuthActionState,
} from "@/features/auth/actions";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const initialState: AuthActionState = { ok: true };

export function MagicLinkConfirmForm({
  locale,
  email,
  token,
}: {
  locale: string;
  email: string;
  token: string;
}) {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const boundAction = confirmMagicLinkAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      {!state.ok && state.code ? (
        <p className="text-sm text-destructive">{tErrors(state.code)}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("magicLinkConfirmButton")}
      </Button>
    </form>
  );
}
