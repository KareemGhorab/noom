import { isEmailVerified } from "@/features/auth/queries";
import { getSessionUser } from "@/lib/auth/session";
import { VerificationBanner } from "./verification-banner";

export async function VerificationBannerGate({ locale }: { locale: string }) {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  if (await isEmailVerified(user.id)) {
    return null;
  }

  return <VerificationBanner locale={locale} />;
}
