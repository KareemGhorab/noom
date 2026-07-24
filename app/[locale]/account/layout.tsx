import { requireSessionUser } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSessionUser(locale);

  return <div className="mx-auto max-w-3xl space-y-6">{children}</div>;
}
