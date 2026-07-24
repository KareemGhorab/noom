import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for Playwright. Start Postgres and copy .env.example → .env.",
    );
  }

  execSync("pnpm db:seed", {
    stdio: "inherit",
    env: process.env,
  });
}
