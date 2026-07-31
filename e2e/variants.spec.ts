import { expect, test } from "@playwright/test";
import { addToCartFromPdp, pickVariantOption } from "./helpers/cart";

test.describe("Product variants", () => {
  test("adds a sized canvas tote after picking M", async ({ page }) => {
    await page.goto("/en/product/canvas-tote");

    await expect(page.getByText("Choose Size")).toBeVisible();
    await pickVariantOption(page, "Canvas Tote Bag", "M");
    await addToCartFromPdp(page, "Canvas Tote Bag");

    await page.goto("/en/cart");
    await expect(page.getByText("Canvas Tote Bag")).toBeVisible();
    await expect(page.getByText("Size: M")).toBeVisible();
  });
});
