import { expect, test } from "@playwright/test";
import { DEMO_EMAIL, loginAsDemo } from "./helpers/auth";
import { deleteReviewVotesBy } from "./helpers/db";

// Seeded product with two reviews (5★ Amina, 4★ Omar) and a helpful vote.
const PRODUCT = "/en/product/wireless-earbuds";

test.describe("Reviews v2", () => {
  test("shows verified purchase badges and rating distribution", async ({
    page,
  }) => {
    await page.goto(PRODUCT);

    await expect(
      page.getByRole("heading", { name: "Reviews" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Rating distribution"),
    ).toBeVisible();
    await expect(
      page.getByText("Verified purchase").first(),
    ).toBeVisible();
  });

  test("filters the list by star count via the URL", async ({ page }) => {
    await page.goto(`${PRODUCT}?stars=5`);

    await expect(
      page.getByRole("listitem").filter({ hasText: "Tiny case, huge battery" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("listitem").filter({ hasText: "Great, once they fit" }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Show all ratings" }).click();
    await expect(page).toHaveURL(/\/en\/product\/wireless-earbuds/);
    await expect(
      page.getByRole("listitem").filter({ hasText: "Great, once they fit" }),
    ).toHaveCount(1);
  });

  test("lets a signed-in shopper mark a review helpful", async ({ page }) => {
    await deleteReviewVotesBy(DEMO_EMAIL);
    await loginAsDemo(page);
    await page.goto(PRODUCT);

    const aminaReview = page
      .getByRole("listitem")
      .filter({ hasText: "Tiny case, huge battery" });

    await expect(aminaReview.getByText("Verified purchase")).toBeVisible();

    const helpful = aminaReview.getByRole("button", { name: /Helpful/ });
    await expect(helpful).toBeVisible();
    await helpful.click();

    // Toggle on; seed already has Omar's vote so the count stays ≥ 1.
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect(helpful).toContainText(/Helpful \(\d+\)/);
  });
});
