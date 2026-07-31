import { expect, test } from "@playwright/test";

test.describe("Catalog filtering", () => {
  test("sorts by price and keeps the sort in the URL", async ({ page }) => {
    await page.goto("/en/search");

    await page.getByLabel("Sort by").selectOption("priceAsc");
    await expect(page).toHaveURL(/sort=priceAsc/);

    const prices = await page
      .locator("[data-slot='card-content'] p.font-semibold")
      .allInnerTexts();
    // Cards may show a min–max range; sort uses min price, so take the first.
    const numbers = prices.map((text) => {
      const match = text.match(/[\d]+(?:\.[\d]+)?/);
      return match ? Number(match[0]) : Number.NaN;
    });

    expect(numbers.length).toBeGreaterThan(1);
    expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
  });

  test("sorts reviewed products ahead of unreviewed ones", async ({ page }) => {
    await page.goto("/en/search");

    await page.getByLabel("Sort by").selectOption("rating");
    await expect(page).toHaveURL(/sort=rating/);

    const cards = page.locator("[data-slot='card']");
    const ratedFirst = cards.first().getByRole("img", { name: /out of 5/ });
    const ratedLast = cards.last().getByRole("img", { name: /out of 5/ });

    await expect(ratedFirst).toBeVisible();
    await expect(ratedLast).toHaveCount(0);
  });

  test("filters by price range", async ({ page }) => {
    await page.goto("/en/search");

    await page.getByLabel("Min price").fill("100");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/minPrice=100/);
    await expect(page.getByText("Wireless Earbuds")).toBeVisible();
    await expect(page.getByText("Ceramic Mug")).toHaveCount(0);
  });

  test("narrows rather than replaces when a query and category combine", async ({
    page,
  }) => {
    await page.goto("/en/search?q=mug&category=home");

    await expect(page.getByText("Ceramic Mug")).toBeVisible();
    await expect(page.getByText("Throw Blanket")).toHaveCount(0);
  });

  test("paginates and clamps an out-of-range page", async ({ page }) => {
    await page.goto("/en/search?perPage=4");
    await expect(page.getByText("Page 1 of 3")).toBeVisible();

    await page.getByRole("link", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Page 2 of 3")).toBeVisible();

    await page.goto("/en/search?perPage=4&page=99");
    await expect(page.getByText("Page 3 of 3")).toBeVisible();
  });

  test("rejects an overlong query with a distinct message", async ({
    page,
  }) => {
    await page.goto(`/en/search?q=${"a".repeat(150)}`);
    await expect(
      page.getByText("That search was too long. Try a shorter query.").first(),
    ).toBeVisible();
  });
});
