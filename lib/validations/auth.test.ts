import { describe, expect, it } from "vitest";
import {
    changePasswordSchema,
    loginSchema,
    magicLinkConsumeSchema,
    normalizeEmail,
    registerSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from "./auth";

describe("email normalization", () => {
  it("lowercases and trims addresses", () => {
    expect(normalizeEmail("  Demo@Noom.App ")).toBe("demo@noom.app");
  });

  it("rejects malformed addresses", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });

  it("normalizes through the register and login schemas", () => {
    const registered = registerSchema.parse({
      name: "Demo Shopper",
      email: "DEMO@NOOM.APP",
      password: "demo1234",
    });
    expect(registered.email).toBe("demo@noom.app");

    const loggedIn = loginSchema.parse({
      email: "Demo@Noom.App",
      password: "demo1234",
    });
    expect(loggedIn.email).toBe("demo@noom.app");
  });
});

describe("registerSchema", () => {
  it("enforces the minimum password length", () => {
    const result = registerSchema.safeParse({
      name: "Demo Shopper",
      email: "demo@noom.app",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("enforces the maximum password length", () => {
    const result = registerSchema.safeParse({
      name: "Demo Shopper",
      email: "demo@noom.app",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
  });

  it("enforces the name bounds", () => {
    expect(
      registerSchema.safeParse({
        name: "a",
        email: "demo@noom.app",
        password: "demo1234",
      }).success,
    ).toBe(false);

    expect(
      registerSchema.safeParse({
        name: "a".repeat(101),
        email: "demo@noom.app",
        password: "demo1234",
      }).success,
    ).toBe(false);
  });
});

describe("magicLinkConsumeSchema", () => {
  it("requires a uuid token", () => {
    expect(
      magicLinkConsumeSchema.safeParse({
        email: "demo@noom.app",
        token: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("accepts a uuid token and normalizes the email", () => {
    const parsed = magicLinkConsumeSchema.parse({
      email: "Demo@Noom.App",
      token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });
    expect(parsed.email).toBe("demo@noom.app");
  });
});

describe("verifyEmailSchema", () => {
  it("requires a uuid token", () => {
    expect(
      verifyEmailSchema.safeParse({
        email: "demo@noom.app",
        token: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("accepts a uuid token and normalizes the email", () => {
    const parsed = verifyEmailSchema.parse({
      email: "Demo@Noom.App",
      token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });
    expect(parsed.email).toBe("demo@noom.app");
  });
});

describe("requestPasswordResetSchema", () => {
  it("normalizes the email", () => {
    expect(
      requestPasswordResetSchema.parse({ email: " Demo@Noom.App " }).email,
    ).toBe("demo@noom.app");
  });

  it("rejects a malformed email", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  const token = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  it("accepts a matching confirmation", () => {
    const parsed = resetPasswordSchema.parse({
      email: "DEMO@noom.app",
      token,
      password: "newpassword",
      confirmPassword: "newpassword",
    });
    expect(parsed.email).toBe("demo@noom.app");
  });

  it("rejects a mismatched confirmation", () => {
    expect(
      resetPasswordSchema.safeParse({
        email: "demo@noom.app",
        token,
        password: "newpassword",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("rejects a short password", () => {
    expect(
      resetPasswordSchema.safeParse({
        email: "demo@noom.app",
        token,
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid token", () => {
    expect(
      resetPasswordSchema.safeParse({
        email: "demo@noom.app",
        token: "nope",
        password: "newpassword",
        confirmPassword: "newpassword",
      }).success,
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "demo1234",
        password: "newpassword",
        confirmPassword: "newpassword",
      }).success,
    ).toBe(true);
  });

  it("rejects reusing the current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "demo1234",
        password: "demo1234",
        confirmPassword: "demo1234",
      }).success,
    ).toBe(false);
  });

  it("rejects a mismatched confirmation", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "demo1234",
        password: "newpassword",
        confirmPassword: "nope12345",
      }).success,
    ).toBe(false);
  });

  it("requires the current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "",
        password: "newpassword",
        confirmPassword: "newpassword",
      }).success,
    ).toBe(false);
  });
});
