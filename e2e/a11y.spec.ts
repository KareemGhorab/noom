import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoCriticalViolations(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  );

  expect(
    critical,
    critical
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
      )
      .join("\n") || "critical axe violations",
  ).toEqual([]);
}

test.describe("Accessibility (axe)", () => {
  test("home has no critical violations", async ({ page }) => {
    await expectNoCriticalViolations(page, "/en");
  });

  test("search has no critical violations", async ({ page }) => {
    await expectNoCriticalViolations(page, "/en/search");
  });

  test("product detail has no critical violations", async ({ page }) => {
    await expectNoCriticalViolations(page, "/en/product/wireless-earbuds");
  });

  test("cart has no critical violations", async ({ page }) => {
    await expectNoCriticalViolations(page, "/en/cart");
  });

  test("login has no critical violations", async ({ page }) => {
    await expectNoCriticalViolations(page, "/en/auth/login");
  });
});
