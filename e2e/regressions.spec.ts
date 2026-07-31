import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers/auth";
import { addToCartFromPdp } from "./helpers/cart";

test.describe("Audit regressions", () => {
  test("prefixes an unprefixed URL with the default locale", async ({
    page,
  }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/en\/cart/);
  });

  test("returns 404 for a non-uuid order id instead of a server error", async ({
    page,
  }) => {
    const response = await page.goto("/en/checkout/confirmation/not-a-uuid");

    expect(response?.status()).toBe(404);
  });

  test("hides a confirmation page from another session", async ({
    page,
    browser,
  }) => {
    await page.goto("/en/product/wireless-earbuds");
    await addToCartFromPdp(page, "Wireless Earbuds");

    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Guest Shopper");
    await page.getByLabel("Email").fill("regression-guest@noom.app");
    await page.getByLabel("Phone").fill("+971501112244");
    await page.getByLabel("Address", { exact: true }).fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    const confirmationUrl = page.url();

    // A second browser context has neither the session nor the
    // `noom_last_order` cookie that gates the page.
    const stranger = await browser.newContext();
    const strangerPage = await stranger.newPage();
    const response = await strangerPage.goto(confirmationUrl);

    expect(response?.status()).toBe(404);
    await stranger.close();
  });

  test("keeps an Arabic order page free of English status strings", async ({
    page,
  }) => {
    await loginAsDemo(page, "ar");
    await page.goto("/ar/account/orders");

    await expect(
      page.getByRole("heading", { name: "سجل الطلبات" }),
    ).toBeVisible();
    await expect(page.getByText("Placed", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Cancelled", { exact: true })).toHaveCount(0);
  });

  test("shows a localized error rather than an English sentence", async ({
    page,
  }) => {
    await page.goto("/ar/auth/login");
    await page.getByLabel("البريد الإلكتروني").fill("demo@noom.app");
    await page.getByLabel("كلمة المرور").fill("wrong-password");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();

    await expect(
      page.getByText("البريد أو كلمة المرور غير صحيحة."),
    ).toBeVisible();
    await expect(
      page.getByText("Invalid email or password.", { exact: true }),
    ).toHaveCount(0);
  });
});
