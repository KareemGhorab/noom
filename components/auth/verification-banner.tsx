"use client";

import { Button } from "@/components/ui/button";
import {
    resendVerificationEmailAction,
    type AuthActionState,
} from "@/features/auth/actions";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function VerificationBanner({ locale }: { locale: string }) {
  const t = useTranslations("EmailVerification");
  const tErrors = useTranslations("Errors");
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<AuthActionState | null>(null);
  const [pending, startTransition] = useTransition();

  if (dismissed) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-md border border-border bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{t("bannerTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("bannerBody")}</p>
        {result ? (
          <p
            className={
              result.ok
                ? "mt-1 text-sm text-muted-foreground"
                : "mt-1 text-sm text-destructive"
            }
          >
            {result.ok
              ? t("resent")
              : result.code
                ? tErrors(result.code)
                : null}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const next = await resendVerificationEmailAction(locale);
              setResult(next);
            });
          }}
        >
          {t("resend")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("dismiss")}
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
