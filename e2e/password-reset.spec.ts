import { expect, test } from "@playwright/test";
import { issuePasswordResetToken, upsertPasswordUser } from "./helpers/db";

// A reset invalidates every outstanding token for its address, so each test
// owns a distinct account and the file can stay parallel.
const COMPLETE_EMAIL = "reset-complete@noom.app";
const MISMATCH_EMAIL = "reset-mismatch@noom.app";
const OLD_PASSWORD = "oldpass1234";
const NEW_PASSWORD = "newpass1234";

test.describe("Password reset", () => {
  test("answers the same way for an unknown email", async ({ page }) => {
    await page.goto("/en/auth/forgot-password");
    await page.getByLabel("Email").fill("nobody-here@noom.app");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page).toHaveURL(/sent=1/);
    await expect(page.getByText(/a reset link is on its way/)).toBeVisible();
  });

  test("completes a reset and signs in with the new password", async ({
    page,
  }) => {
    await upsertPasswordUser(COMPLETE_EMAIL, OLD_PASSWORD);
    const token = await issuePasswordResetToken(COMPLETE_EMAIL);

    await page.goto(
      `/en/auth/reset-password?token=${token}&email=${encodeURIComponent(
        COMPLETE_EMAIL,
      )}`,
    );
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toBeVisible();

    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(page).toHaveURL(/\/en\/auth\/login\?reset=1/);
    await expect(
      page.getByText("Password updated. You can sign in now."),
    ).toBeVisible();

    await page.getByLabel("Email").fill(COMPLETE_EMAIL);
    await page.getByLabel("Password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/\/en\/?$/);
    await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  });

  test("rejects a malformed reset link", async ({ page }) => {
    await page.goto("/en/auth/reset-password?token=not-a-token&email=a@b.com");

    await expect(
      page.getByRole("heading", { name: "Link expired" }),
    ).toBeVisible();
  });

  test("rejects a token that does not match", async ({ page }) => {
    await upsertPasswordUser(MISMATCH_EMAIL, OLD_PASSWORD);
    await issuePasswordResetToken(MISMATCH_EMAIL);

    await page.goto(
      `/en/auth/reset-password?token=${crypto.randomUUID()}&email=${encodeURIComponent(
        MISMATCH_EMAIL,
      )}`,
    );
    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(
      page.getByText("This reset link is invalid or has expired."),
    ).toBeVisible();
  });
});
