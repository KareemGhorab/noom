import { expect, test } from "@playwright/test";

test.describe("Guest shopper journey", () => {
  test("adds a product to cart, checks out, places a demo order, and leaves cart empty", async ({
    page,
  }) => {
    await page.goto("/en/product/wireless-earbuds");
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(/\/en\/cart/);
    await expect(
      page.getByRole("heading", { name: "Your cart" }),
    ).toBeVisible();
    await expect(page.getByText("Wireless Earbuds")).toBeVisible();

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/en\/checkout/);
    await expect(
      page.getByText("Demo checkout — no charge").first(),
    ).toBeVisible();

    await page.getByLabel("Full name").fill("E2E Shopper");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address").fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    await expect(
      page.getByRole("heading", { name: "Order placed" }),
    ).toBeVisible();
    await expect(page.getByText("Order ID")).toBeVisible();
    await expect(page.getByText("Wireless Earbuds")).toBeVisible();

    await page.goto("/en/cart");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });
});
