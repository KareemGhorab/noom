import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers/auth";

test.describe("Account area", () => {
  test("redirects guests from account to login", async ({ page }) => {
    await page.goto("/en/account");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("shows profile, seeded orders, and wishlist for the demo user", async ({
    page,
  }) => {
    await loginAsDemo(page);

    await page.getByRole("link", { name: "Account" }).click();
    await expect(page).toHaveURL(/\/en\/account$/);
    await expect(
      page.getByRole("heading", { name: "Your profile" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("demo@noom.app");

    await page.getByRole("link", { name: "Orders", exact: true }).first().click();
    await expect(page).toHaveURL(/\/en\/account\/orders/);
    await expect(
      page.getByRole("heading", { name: "Order history" }),
    ).toBeVisible();
    await expect(page.getByText(/Order /).first()).toBeVisible();

    await page.getByRole("link", { name: "Wishlist", exact: true }).first().click();
    await expect(page).toHaveURL(/\/en\/account\/wishlist/);
    await expect(
      page.getByRole("heading", { name: "Wishlist" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Wireless|Smart|Canvas|Sketch/i }).first()).toBeVisible();
  });
});
