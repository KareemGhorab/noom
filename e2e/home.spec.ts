import { expect, test } from "@playwright/test";

test.describe("Home & locales", () => {
  test("shows the Noom brand and featured products in English", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(page.getByRole("link", { name: "Noom" }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to Noom" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Featured products" }),
    ).toBeVisible();
    await expect(page.locator('a[href*="/product/"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" }).first()).toBeVisible();
  });

  test("renders Arabic locale with RTL direction", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(
      page.getByRole("heading", { name: "مرحباً بك في نوم" }),
    ).toBeVisible();
  });
});
