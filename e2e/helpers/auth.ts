import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@noom.app";
export const DEMO_PASSWORD = "demo1234";

export async function loginAsDemo(page: Page, locale = "en") {
  await page.goto(`/${locale}/auth/login`);
  await page.getByLabel(locale === "ar" ? "البريد الإلكتروني" : "Email").fill(DEMO_EMAIL);
  await page.getByLabel(locale === "ar" ? "كلمة المرور" : "Password").fill(DEMO_PASSWORD);
  await page
    .getByRole("button", {
      name: locale === "ar" ? "تسجيل الدخول" : "Sign in",
    })
    .click();
  await page.waitForURL(new RegExp(`/${locale}/?$`));
}
