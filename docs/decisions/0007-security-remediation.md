# 0007 — Security remediation and the server-action error contract

- Date: 2026-07-31
- Status: accepted

## Context

An audit of the Phase 1 and Phase 2 code found a cluster of issues that shared
one root cause: untrusted input reached privileged code paths unvalidated, and
failures were reported as English sentences rather than data.

The concrete findings were an open redirect in the magic-link verify route (the
`locale` search param was interpolated into a redirect), a publicly readable
order confirmation page, non-UUID route params reaching Postgres as 500s, a
guest cart cookie without the `secure` flag, case-sensitive emails allowing two
accounts for one person, magic-link tokens that could be consumed twice under a
race and that created user rows before the address was verified, and checkout
stock validation that read and wrote in separate statements.

## Decision

- Validate every locale against `routing.locales` in `lib/i18n/locale.ts`;
  `resolveLocale` falls back to the default locale rather than trusting input,
  and `localePath` is the only supported way to build a locale-prefixed URL.
- Parse UUID route params through `parseUuid` so a malformed segment renders a
  404 instead of raising a Postgres type error.
- Gate the order confirmation page on either session ownership or a short-lived
  `noom_last_order` httpOnly cookie, encoded in `canViewOrderConfirmation`.
- Validate environment variables once at startup in `lib/env.ts`, so a missing
  `AUTH_SECRET` fails the boot rather than the first request that needs it.
- Consume single-use tokens with an atomic `DELETE ... RETURNING`, and defer
  user creation until a magic-link token is actually verified.
- Server actions return an `ActionErrorCode` from `lib/errors.ts`, never a
  sentence. The client resolves the code against the `Errors` message
  namespace.
- Wrap checkout in a transaction and decrement stock relatively
  (`stock = stock - n WHERE stock >= n`) so concurrent orders cannot oversell.

## Consequences

- Adding a server action means adding an error code and a translation in both
  message files; the parity test in `messages.test.ts` fails otherwise.
- JWT sessions still cannot be revoked server-side. A password change does not
  invalidate sessions on other devices, and the account UI says so.
- `trustHost: true` remains set for Auth.js, which is safe behind the single
  known host this demo deploys to and is documented inline in `auth.ts`.
