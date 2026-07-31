"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function PrintInvoiceButton() {
  const t = useTranslations("Invoice");

  return (
    <Button
      type="button"
      variant="outline"
      className="print:hidden"
      onClick={() => window.print()}
    >
      {t("print")}
    </Button>
  );
}
