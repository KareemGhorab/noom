# ADR 0001: Stack selection

## Status

Accepted

## Context

Noom MVP needs a full-stack TypeScript app with i18n, auth, Postgres, and a distinctive UI quickly.

## Decision

Use Next.js 16 App Router, Drizzle + Postgres, Auth.js beta, next-intl, Tailwind v4, Vitest, and `@kareem-ghorab/theme`.

## Consequences

- JWT sessions required for credentials auth
- Next.js 16 `proxy.ts` replaces legacy middleware naming
- Theme CSS imports must follow doodle-ui ordering (fonts → tailwind → styles)
