import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!token || !email) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?error=invalid`, request.url),
    );
  }

  try {
    await signIn("magic-link", {
      email,
      token,
      redirectTo: `/${locale}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login?error=expired`, request.url),
      );
    }
    throw error;
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
