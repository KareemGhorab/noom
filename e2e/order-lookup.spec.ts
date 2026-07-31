import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers/auth";
import { addToCartFromPdp } from "./helpers/cart";

const GUEST_EMAIL = "lookup-guest@noom.app";

test.describe("Guest order lookup and invoices", () => {
  test("guest looks up an order by email and id after clearing cookies", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/en/product/sketch-journal");
    await addToCartFromPdp(page, "Sketch Journal");

    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Lookup Guest");
    await page.getByLabel("Email").fill(GUEST_EMAIL);
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address").fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    const orderId = page.url().split("/").pop()!;
    expect(orderId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    await context.clearCookies();

    await page.goto(`/en/checkout/confirmation/${orderId}`);
    await expect(
      page.getByRole("heading", { name: "Order not found." }),
    ).toBeVisible();

    await page.goto("/en/orders/lookup");
    await expect(
      page.getByRole("heading", { name: "Find your order" }),
    ).toBeVisible();
    await page.getByLabel("Email").fill(GUEST_EMAIL);
    await page.getByLabel("Order ID").fill(orderId);
    await page.getByRole("button", { name: "Find order" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/en/checkout/confirmation/${orderId}$`),
    );
    await expect(
      page.getByRole("heading", { name: "Order placed" }),
    ).toBeVisible();
    await expect(page.getByText("Sketch Journal")).toBeVisible();

    await page.getByRole("link", { name: "View invoice" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/en/checkout/confirmation/${orderId}/invoice$`),
    );
    await expect(page.getByRole("heading", { name: "Invoice" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();

    await context.close();
  });

  test("signed-in user opens a printable invoice for their order", async ({
    page,
  }) => {
    await loginAsDemo(page);

    await page.goto("/en/product/ceramic-mug");
    await addToCartFromPdp(page, "Ceramic Mug");
    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Demo Shopper");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address", { exact: true }).fill("Test Marina");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
    const orderId = page.url().split("/").pop()!;

    await page.goto(`/en/account/orders/${orderId}/invoice`);
    await expect(page.getByRole("heading", { name: "Invoice" })).toBeVisible();
    await expect(page.getByText(orderId)).toBeVisible();
    await expect(page.getByText("Ceramic Mug")).toBeVisible();
    await expect(page.getByText(/Ship to/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  });
});
