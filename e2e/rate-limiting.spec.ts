import { expect, test } from "@playwright/test";

test.describe("Rate limiting", () => {
  test("rejects the sixth rapid failed login attempt", async ({ page }) => {
    // A fresh, never-registered address per run keeps this test's rate-limit
    // bucket isolated from the demo account (which other specs sign in with
    // repeatedly) and from earlier runs of this same test within the window.
    const EMAIL = `rate-limit-${crypto.randomUUID()}@noom.app`;

    await page.goto("/en/auth/login");

    const submit = () =>
      Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            response.url().includes("/auth/login"),
        ),
        page.getByRole("button", { name: "Sign in" }).click(),
      ]);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password").fill(`wrong-password-${attempt}`);
      await submit();
      await expect(
        page.getByText("Invalid email or password."),
      ).toBeVisible();
    }

    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill("wrong-password-6");
    await submit();

    await expect(
      page.getByText("Too many attempts. Please wait a bit and try again."),
    ).toBeVisible();
  });
});
