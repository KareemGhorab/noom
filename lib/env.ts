import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    AUTH_URL: z.string().url("AUTH_URL must be an absolute URL"),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    EMAIL_SERVER: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.AUTH_GOOGLE_ID) === Boolean(value.AUTH_GOOGLE_SECRET),
    { message: "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set together" },
  )
  .refine(
    (value) => Boolean(value.EMAIL_SERVER) === Boolean(value.EMAIL_FROM),
    { message: "EMAIL_SERVER and EMAIL_FROM must be set together" },
  );

function parseEnv() {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL ?? "http://localhost:3000",
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    EMAIL_SERVER: process.env.EMAIL_SERVER,
    EMAIL_FROM: process.env.EMAIL_FROM,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill in the missing values.`,
    );
  }

  return parsed.data;
}

export const env = parseEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const hasEmailTransport = Boolean(env.EMAIL_SERVER && env.EMAIL_FROM);
