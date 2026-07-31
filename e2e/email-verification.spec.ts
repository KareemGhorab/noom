import { expect, test } from "@playwright/test";
import { addToCartFromPdp } from "./helpers/cart";
import { getEmailVerificationToken } from "./helpers/db";

test.describe("Email verification", () => {
  test("gates checkout until the shopper verifies their email", async ({
    page,
  }) => {
    const email = `verify-${crypto.randomUUID()}@noom.app`;
    const password = "verify1234";

    await page.goto("/en/auth/register");
    await page.getByLabel("Name").fill("Verify Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/registered=1/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/en\/?$/);

    await expect(page.getByText("Verify your email")).toBeVisible();

    await page.goto("/en/product/wireless-earbuds");
    await addToCartFromPdp(page, "Wireless Earbuds");

    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Verify Tester");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address", { exact: true }).fill("Test Street 1");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(
      page.getByText("Please verify your email before continuing."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/checkout$/);

    const token = await getEmailVerificationToken(email);
    expect(token).toBeTruthy();

    await page.goto(
      `/en/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
    );
    await expect(
      page.getByRole("heading", { name: "Confirm your email" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Verify email" }).click();

    await expect(page).toHaveURL(/\/en\/auth\/login\?verified=1/);
    await expect(page.getByText("Email verified.")).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/en\/?$/);

    await expect(page.getByText("Verify your email")).toHaveCount(0);

    await page.goto("/en/checkout");
    await page.getByLabel("Full name").fill("Verify Tester");
    await page.getByLabel("Phone").fill("+971501112233");
    await page.getByLabel("Address", { exact: true }).fill("Test Street 1");
    await page.getByLabel("City").fill("Dubai");
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/en\/checkout\/confirmation\//);
  });
});
