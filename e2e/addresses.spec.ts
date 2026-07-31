import { expect, test } from "@playwright/test";
import { DEMO_EMAIL, loginAsDemo } from "./helpers/auth";
import { addToCartFromPdp } from "./helpers/cart";
import { deleteAddressesLabelled } from "./helpers/db";

const LABEL = "Studio";

test.describe.configure({ mode: "serial" });

test.describe("Saved addresses", () => {
  test.beforeEach(async () => {
    await deleteAddressesLabelled(DEMO_EMAIL, LABEL);
  });

  test.afterEach(async () => {
    await deleteAddressesLabelled(DEMO_EMAIL, LABEL);
  });

  test("adds an address, makes it default, and prefills checkout", async ({
    page,
  }) => {
    await loginAsDemo(page);
    await page.goto("/en/account/addresses");
    await expect(
      page.getByRole("heading", { name: "Addresses" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add address" }).click();
    await page.getByLabel("Label").fill(LABEL);
    await page.getByLabel("Full name").fill("Studio Shopper");
    await page.getByLabel("Phone").fill("+971509998877");
    await page.getByLabel("Address", { exact: true }).fill("Alserkal Avenue");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Save address" }).click();

    await expect(page.getByText("Address saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByText(LABEL, { exact: true })).toBeVisible();

    const row = page.getByRole("listitem").filter({ hasText: LABEL });
    await row.getByRole("button", { name: "Use as default" }).click();
    await expect(row.getByText("Default")).toBeVisible();

    await page.goto("/en/product/ceramic-mug");
    await addToCartFromPdp(page, "Ceramic Mug");

    await page.goto("/en/checkout");
    await expect(page.getByLabel("Deliver to")).toHaveValue(/.+/);
    await expect(page.getByLabel("Full name")).toHaveValue("Studio Shopper");
    await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
      "Alserkal Avenue",
    );
  });
});
