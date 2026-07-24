# ADR 0003: Auth and demo checkout

## Status

Accepted

## Context

Noom is a demo marketplace. Real payments and production email are out of scope.

## Decision

- Auth: email/password, optional Google OAuth, magic link with console URL fallback
- Checkout: persist `placed` orders without charging
- Seed demo user `demo@noom.app` / `demo1234`

## Consequences

- Order line items store snapshot fields
- Magic link verify route uses credentials provider `magic-link`
- UI shows persistent demo checkout banner
