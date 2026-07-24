import { expect, test } from "@playwright/test";
import { DEMO_EMAIL, loginAsDemo } from "./helpers/auth";

test.describe("Auth", () => {
  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("signs in the demo shopper", async ({ page }) => {
    await loginAsDemo(page);

    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  });

  test("keeps password field required", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/auth\/login/);
    await expect(page.getByLabel("Password")).toBeFocused();
  });
});
