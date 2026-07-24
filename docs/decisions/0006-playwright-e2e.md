# 0006 — Playwright E2E suite

- Date: 2026-07-24
- Status: accepted

## Context

Unit/Zod tests covered contracts, but Must flows still needed browser-level coverage (auth redirects, cart → checkout, i18n RTL).

## Decision

- Add `@playwright/test` with Chromium-only default project
- Specs under `e2e/`; `webServer` runs `pnpm dev`; global setup re-seeds the DB
- Prefer role/label selectors over `data-testid` unless a control is ambiguous

## Consequences

- `pnpm test:e2e` requires Postgres + `.env`
- CI should set `CI=1` (no server reuse, single worker, retries)
