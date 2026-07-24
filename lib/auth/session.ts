import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user?.id
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;
}

export async function requireSessionUser(locale: string) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }
  return user;
}
