import { AccountNav } from "@/components/account/account-nav";
import { ProfileForm } from "@/components/account/profile-form";
import { getUserProfile } from "@/features/account/queries";
import { requireSessionUser } from "@/lib/auth/session";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
    </>
  );
}
