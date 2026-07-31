import { expect, test } from "@playwright/test";

test.describe("Catalog", () => {
  test("searches products and opens a PDP", async ({ page }) => {
    await page.goto("/en");

    await page.getByLabel("Search").fill("earbuds");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/en\/search\?q=earbuds/);
    await expect(
      page.getByRole("heading", { name: /Results for "earbuds"/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Wireless Earbuds" }).first().click();

    await expect(page).toHaveURL(/\/en\/product\/wireless-earbuds/);
    await expect(
      page.getByRole("heading", { name: "Wireless Earbuds" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Wireless Earbuds" })
        .getByRole("button", { name: "Add to cart" }),
    ).toBeVisible();
  });

  test("shows empty search state for unknown queries", async ({ page }) => {
    await page.goto("/en/search?q=zzzz-noom-no-match");

    await expect(page.getByRole("heading", { name: "No matches" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue shopping" }),
    ).toBeVisible();
  });

  test("shows product not found for unknown slug", async ({ page }) => {
    await page.goto("/en/product/does-not-exist-noom");

    await expect(
      page.getByRole("heading", { name: "Product not found" }),
    ).toBeVisible();
  });
});
