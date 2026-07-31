import { expect, test } from "@playwright/test";
import { loginAsDemo, DEMO_EMAIL } from "./helpers/auth";
import { addToCartFromPdp } from "./helpers/cart";
import { clearCartForUser } from "./helpers/db";

/**
 * Each test places its own order rather than reusing the seeded one, so
 * cancelling does not leave the next run without a cancellable order.
 */
async function placeOrderAsDemo(page: import("@playwright/test").Page) {
  await clearCartForUser(DEMO_EMAIL);
  await page.goto("/en/product/ceramic-mug");
  await addToCartFromPdp(page, "Ceramic Mug");

  await page.goto("/en/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByLabel("Full name").fill("Demo Shopper");
  await page.getByLabel("Phone").fill("+971501112233");
  await page.getByLabel("Address", { exact: true }).fill("Test Marina");
  await page.getByLabel("City").fill("Dubai");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
}

test.describe("Order lifecycle", () => {
  test("cancels a placed order and restores its status", async ({ page }) => {
    await loginAsDemo(page);
    await placeOrderAsDemo(page);

    await page.goto("/en/account/orders");
    await page.getByRole("link", { name: /^Order / }).first().click();
    await expect(
      page.getByRole("heading", { name: "Order details" }),
    ).toBeVisible();
    await expect(page.getByText("Status: Placed")).toBeVisible();

    await page.getByRole("button", { name: "Cancel order" }).click();

    await expect(page.getByText("Order cancelled.")).toBeVisible();
    await expect(page.getByText("Status: Cancelled")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel order" }),
    ).toHaveCount(0);
  });

  test("reorders a past order back into the cart", async ({ page }) => {
    await loginAsDemo(page);
    await placeOrderAsDemo(page);

    await page.goto("/en/account/orders");
    await page.getByRole("link", { name: /^Order / }).first().click();
    await page.getByRole("button", { name: "Buy again" }).click();

    await expect(page.getByText(/added to your cart/)).toBeVisible();

    await page.goto("/en/cart");
    await expect(page.getByText("Ceramic Mug").first()).toBeVisible();
  });
});
