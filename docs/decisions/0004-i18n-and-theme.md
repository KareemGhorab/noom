# ADR 0004: i18n and theme

## Status

Accepted

## Context

Noom targets English and Arabic shoppers with doodle aesthetic and dark mode.

## Decision

- next-intl with locales `en` and `ar`, default `en`
- RTL via `dir="rtl"` on `<html>` for Arabic
- next-themes class strategy with `@kareem-ghorab/theme` tokens
- Cairo font fallback for Arabic body/display

## Consequences

- All routes live under `app/[locale]/*`
- Message files must stay in sync across locales
- Language switcher uses next-intl navigation helpers
