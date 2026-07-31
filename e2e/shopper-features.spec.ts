import { expect, test } from "@playwright/test";
import { DEMO_EMAIL, loginAsDemo } from "./helpers/auth";
import { addToCartFromPdp } from "./helpers/cart";
import {
  clearCartForUser,
  deleteUserByEmail,
  upsertPasswordUser,
  userExists,
  wishlistProductForUser,
} from "./helpers/db";

test.describe("Discount codes", () => {
  test("applies NOOM10 at checkout and reduces the total", async ({ page }) => {
    await page.goto("/en/product/wireless-earbuds");
    await addToCartFromPdp(page, "Wireless Earbuds");

    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Discount Shopper");
    await page.getByLabel("Email").fill("e2e-discount@noom.app");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address").fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByLabel("Discount code").fill("NOOM10");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    await expect(page.getByText(/Discount \(NOOM10\)/)).toBeVisible();
    // 149.00 AED − 10% = 134.10 AED (Intl may use a non-breaking space)
    await expect(page.getByText(/AED\s*134\.10/)).toBeVisible();
  });
});

test.describe("Wishlist to cart", () => {
  test("adds a wishlisted product to the cart", async ({ page }) => {
    await clearCartForUser(DEMO_EMAIL);
    await wishlistProductForUser(DEMO_EMAIL, "sketch-journal");
    await loginAsDemo(page);

    await page.goto("/en/account/wishlist");
    await expect(page.getByRole("heading", { name: "Wishlist" })).toBeVisible();
    await expect(page.getByText("Sketch Journal").first()).toBeVisible();

    // Prefer the wishlist bulk action — ProductCard also exposes "Add to cart"
    // for single-variant items, which would call a different server action.
    await page.getByRole("button", { name: "Add all to cart" }).click();
    await expect(page.getByText(/Added to cart|item added/i)).toBeVisible();

    await page.goto("/en/cart");
    await expect(page.getByText("Sketch Journal").first()).toBeVisible();
  });
});

test.describe("Account export and delete", () => {
  test("shows export download on the account page", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/en/account");

    await expect(
      page.getByRole("heading", { name: "Export your data" }),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/noom-account-export-.*\.json/);
  });

  test("deletes a throwaway account after password confirm", async ({
    page,
  }) => {
    const email = `e2e-delete-${Date.now()}@noom.app`;
    const password = "delete1234";
    await upsertPasswordUser(email, password);

    await page.goto("/en/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/en\/?$/);

    await page.goto("/en/account");
    await page.getByLabel("Confirm with your password").fill(password);
    await page.getByRole("button", { name: "Delete my account" }).click();

    await expect(page).toHaveURL(/\/en\/?$/);
    expect(await userExists(email)).toBe(false);

    // Cleanup is a no-op if delete succeeded; keeps the suite tidy if not.
    await deleteUserByEmail(email);
  });
});
