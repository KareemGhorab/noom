import { expect, test } from "@playwright/test";
import { DEMO_EMAIL, loginAsDemo } from "./helpers/auth";
import { deleteReviewsBy } from "./helpers/db";

// Seeded purchase for the demo user, so the buyer gate is satisfied.
const PRODUCT = "/en/product/bluetooth-speaker";

// These tests share one row: the demo user's review of the product.
test.describe.configure({ mode: "serial" });

test.describe("Reviews", () => {
  test.beforeEach(async () => {
    await deleteReviewsBy(DEMO_EMAIL);
  });

  test.afterEach(async () => {
    await deleteReviewsBy(DEMO_EMAIL);
  });

  test("asks a guest to sign in", async ({ page }) => {
    await page.goto(PRODUCT);

    await expect(
      page.getByText("Sign in to review products you have bought."),
    ).toBeVisible();
  });

  test("blocks a shopper who has not bought the product", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/en/product/studio-cap");

    await expect(
      page.getByText("Only shoppers who bought this product can review it."),
    ).toBeVisible();
  });

  test("posts a review, then shows it in the list and the summary", async ({
    page,
  }) => {
    await loginAsDemo(page);
    await page.goto(PRODUCT);

    await page.getByLabel("5 stars").check();
    await page.getByLabel("Headline (optional)").fill("Loud for its size");
    await page
      .getByLabel("Your review")
      .fill("Filled a whole balcony with sound and survived a weekend trip.");
    await page.getByRole("button", { name: "Post review" }).click();

    await expect(page.getByText("Thanks, your review is live.")).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Loud for its size" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Edit your review" }),
    ).toBeVisible();
  });

  test("keeps one review per shopper when edited", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto(PRODUCT);

    await page.getByLabel("4 stars").check();
    await page
      .getByLabel("Your review")
      .fill("Good sound, though the bass is modest at high volume.");
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByText("Thanks, your review is live.")).toBeVisible();

    await page.reload();
    await page.getByLabel("5 stars").check();
    await page
      .getByLabel("Your review")
      .fill("Revised after a month: it has grown on me considerably.");
    await page.getByRole("button", { name: "Update review" }).click();
    await expect(page.getByText("Thanks, your review is live.")).toBeVisible();

    // Scoped to the list because the form also holds the text it just saved.
    await page.reload();
    await expect(
      page.getByRole("listitem").filter({ hasText: /Revised after a month/ }),
    ).toHaveCount(1);
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: /Good sound, though the bass/ }),
    ).toHaveCount(0);
  });
});
