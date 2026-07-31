import { isProduction } from "@/lib/env";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

// Test-only route that throws unconditionally so `error.tsx` can be exercised
// end-to-end. Never reachable in production.
export default async function DebugErrorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (isProduction) {
    notFound();
  }

  setRequestLocale(locale);
  throw new Error("Debug: forced error for error boundary E2E coverage");
}
