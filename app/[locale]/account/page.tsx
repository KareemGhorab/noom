import { AccountNav } from "@/components/account/account-nav";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DangerZone } from "@/components/account/danger-zone";
import { ProfileForm } from "@/components/account/profile-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { getUserProfile } from "@/features/account/queries";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("accountTitle"), description: t("accountDescription") };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sessionUser = await requireSessionUser(locale);
  const profile = await getUserProfile(sessionUser.id);
  if (!profile) {
    notFound();
  }

  const t = await getTranslations("Account");

  return (
    <>
      <AccountNav active="profile" />
      <div className="doodle-radius-card space-y-4 border bg-card p-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("profileTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("profileSubtitle")}</p>
        </div>
        <ProfileForm
          name={profile.name ?? ""}
          email={profile.email}
        />
      </div>

      {profile.hasPassword ? (
        <div className="doodle-radius-card mt-6 space-y-4 border bg-card p-6">
          <div>
            <h2 className="font-display text-2xl font-bold">
              {t("changePassword")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("changePasswordSubtitle")}
            </p>
          </div>
          <ChangePasswordForm />
        </div>
      ) : null}

      <div className="doodle-radius-card mt-6 space-y-4 border bg-card p-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("exportData")}</h2>
          <p className="mt-2 text-muted-foreground">{t("exportDataSubtitle")}</p>
        </div>
        {/* API attachment download — not an App Router page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/account/export"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {t("exportButton")}
        </a>
      </div>

      <DangerZone locale={locale} hasPassword={profile.hasPassword} />
    </>
  );
}
