import { expect, type Page } from "@playwright/test";

/**
 * Navigating straight after the click can outrun the add-to-cart action and
 * its cookie, so this waits for the header badge the action revalidates.
 */
export async function addToCartFromPdp(page: Page, productTitle: string) {
  const region = page.getByRole("region", { name: productTitle });

  // Multi-variant PDPs need a selection before Add to cart enables; the picker
  // preselects the first in-stock combination, so a click is usually enough.
  await region.getByRole("button", { name: "Add to cart" }).click();

  await expect(
    page.getByRole("link", { name: "Cart" }).getByText(/^\d+$/),
  ).toBeVisible();
}

export async function pickVariantOption(
  page: Page,
  productTitle: string,
  optionValue: string,
) {
  await page
    .getByRole("region", { name: productTitle })
    .getByRole("button", { name: optionValue, exact: true })
    .click();
}
