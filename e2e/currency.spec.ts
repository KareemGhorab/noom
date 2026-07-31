import { expect, test } from "@playwright/test";
import { addToCartFromPdp } from "./helpers/cart";
import { loginAsDemo } from "./helpers/auth";

test.describe("Multi-currency", () => {
  test("switches to USD and settles cart, checkout, and order history in USD", async ({
    page,
  }) => {
    await page.goto("/en/product/wireless-earbuds");

    const pdp = page.getByRole("region", { name: "Wireless Earbuds" });

    // Default catalog is AED — assert before switching.
    await expect(pdp.getByText(/AED\s*[\d.,]+/)).toBeVisible();

    await page.getByRole("button", { name: "Currency" }).click();
    await page.getByRole("menuitem", { name: /USD/ }).click();

    await expect(page.getByRole("button", { name: "Currency" })).toContainText(
      "USD",
    );
    await expect(pdp.getByText(/\$[\d.,]+/)).toBeVisible();
    await expect(pdp.getByText(/AED\s*[\d.,]+/)).toHaveCount(0);

    await addToCartFromPdp(page, "Wireless Earbuds");

    await page.goto("/en/cart");
    await expect(page.getByText("Wireless Earbuds")).toBeVisible();
    await expect(page.getByText(/\$[\d.,]+/).first()).toBeVisible();
    await expect(page.getByText(/AED\s*[\d.,]+/)).toHaveCount(0);

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByText(/\$[\d.,]+/).first()).toBeVisible();
    await expect(page.getByText(/AED\s*[\d.,]+/)).toHaveCount(0);

    await page.getByLabel("Full name").fill("USD Shopper");
    await page.getByLabel("Email").fill("usd-shopper@noom.app");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address", { exact: true }).fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    await expect(page.getByText(/\$[\d.,]+/).first()).toBeVisible();
    await expect(page.getByText(/AED\s*[\d.,]+/)).toHaveCount(0);

    await loginAsDemo(page);
    await page.goto("/en/account/orders");
    await expect(page.getByText(/\$[\d.,]+/).first()).toBeVisible();
  });

  test("default journey still shows AED formatting", async ({ page }) => {
    await page.goto("/en/product/wireless-earbuds");
    await expect(
      page.getByRole("region", { name: "Wireless Earbuds" }).getByText(/AED\s*[\d.,]+/),
    ).toBeVisible();
    await addToCartFromPdp(page, "Wireless Earbuds");
    await page.goto("/en/cart");
    await expect(page.getByText(/AED\s*[\d.,]+/).first()).toBeVisible();
  });
});
