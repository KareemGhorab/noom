import { expect, test } from "@playwright/test";
import {
    seedOrdersForUser,
    upsertPasswordUser,
    wishlistAllProductsForUser,
} from "./helpers/db";

test.describe("Account list pagination", () => {
  test("pages through order history", async ({ page }) => {
    const email = `pagination-orders-${crypto.randomUUID()}@noom.app`;
    const password = "pagination1234";

    await upsertPasswordUser(email, password);
    await seedOrdersForUser(email, 15);

    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/en\/?$/);

    await page.goto("/en/account/orders");
    await expect(page.getByText("Page 1 of 2")).toBeVisible();

    const orderRows = page.getByRole("link", { name: /^Order / });
    await expect(orderRows).toHaveCount(10);

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/\/account\/orders\?page=2/);
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
    await expect(orderRows).toHaveCount(5);
  });

  test("pages through the wishlist", async ({ page }) => {
    const email = `pagination-wishlist-${crypto.randomUUID()}@noom.app`;
    const password = "pagination1234";

    await upsertPasswordUser(email, password);
    await wishlistAllProductsForUser(email);

    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/en\/?$/);

    await page.goto("/en/account/wishlist");
    await expect(page.getByText("Page 1 of 2")).toBeVisible();

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/\/account\/wishlist\?page=2/);
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
  });
});
