# 0014 — Guest order lookup and printable invoices

- Date: 2026-07-31
- Status: accepted

## Context

ADR 0008 accepted that a guest who clears cookies before signing in cannot
claim their order, and that confirmation access is session ownership or the
`noom_last_order` cookie — nothing else. That left guests who lost the cookie
with no way to re-open a confirmation, and neither guests nor signed-in
shoppers had a printable invoice.

## Decision

- Guests enter an email at checkout; it is stored normalized on `orders.email`
  (signed-in shoppers keep using the session email).
- `/orders/lookup` accepts email + order id, rate-limits on `IP + email`, and
  on a case-normalized match sets the same confirmation cookie and redirects
  to `/checkout/confirmation/[orderId]`. Mismatches always return
  `orderLookupFailed` so neither field is enumerable.
- Printable invoices share one component. Account owners use
  `/account/orders/[orderId]/invoice` (`canViewOrder`); guests with the
  confirmation cookie use `/checkout/confirmation/[orderId]/invoice`
  (same gate as confirmation). Chrome is hidden via `@media print` /
  `print:hidden`.

## Consequences

- Guest checkout now requires an email field. Without it, lookup cannot work
  without trusting an unverified address alone or reopening the id-only hole
  ADR 0008 closed.
- Lookup still does not claim the order onto an account; it only restores the
  short-lived confirmation cookie. Claiming remains guest-cookie based
  (`claimGuestOrders`).
