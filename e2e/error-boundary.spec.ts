import { expect, test } from "@playwright/test";

test.describe("Error boundaries", () => {
  test("shows a localized recovery page and retries", async ({ page }) => {
    await page.goto("/en/dev-force-error");

    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    await expect(
      page.getByText("We hit a snag loading this page."),
    ).toBeVisible();

    const retry = page.getByRole("button", { name: "Try again" });
    await expect(retry).toBeVisible();
    await retry.click();

    // Retrying re-runs the page, which throws again deterministically, so the
    // error boundary should still be showing rather than a blank screen.
    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("shows the Arabic recovery page", async ({ page }) => {
    await page.goto("/ar/dev-force-error");

    await expect(
      page.getByRole("heading", { name: "حدث خطأ ما" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "حاول مرة أخرى" })).toBeVisible();
  });
});
