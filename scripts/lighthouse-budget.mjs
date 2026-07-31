#!/usr/bin/env node
/**
 * Runs Lighthouse against a running Noom server and fails if category
 * scores fall below the demo budgets in e2e/lighthouse.budget.json.
 *
 * Expects the app at PLAYWRIGHT_BASE_URL or http://localhost:3000.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const budgetPath = join(__dirname, "..", "e2e", "lighthouse.budget.json");
const budgetFile = JSON.parse(readFileSync(budgetPath, "utf8"));

const baseURL = (
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const scores = budgetFile.budgets?.[0]?.scores ?? {
  performance: 0.5,
  accessibility: 0.9,
};
const paths = budgetFile.urls?.length ? budgetFile.urls : ["/en"];

async function runOne(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility"],
    });

    if (!result?.lhr?.categories) {
      throw new Error(`Lighthouse returned no categories for ${url}`);
    }

    const report = [];
    for (const [category, minScore] of Object.entries(scores)) {
      const actual = result.lhr.categories[category]?.score;
      if (typeof actual !== "number") {
        report.push({ category, minScore, actual: null, ok: false });
        continue;
      }
      report.push({
        category,
        minScore,
        actual,
        ok: actual >= minScore,
      });
    }

    return report;
  } finally {
    await chrome.kill();
  }
}

async function main() {
  let failed = false;

  for (const path of paths) {
    const url = `${baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    console.log(`Lighthouse: ${url}`);

    const report = await runOne(url);
    for (const row of report) {
      const pct = (score) =>
        typeof score === "number" ? `${Math.round(score * 100)}` : "n/a";
      const status = row.ok ? "ok" : "FAIL";
      console.log(
        `  ${status} ${row.category}: ${pct(row.actual)} (budget ${pct(row.minScore)})`,
      );
      if (!row.ok) {
        failed = true;
      }
    }
  }

  if (failed) {
    console.error("Lighthouse budget check failed.");
    process.exit(1);
  }

  console.log("Lighthouse budget check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
