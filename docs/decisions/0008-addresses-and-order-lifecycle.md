# 0008 — Saved addresses, order lifecycle, and confirmation access

- Date: 2026-07-31
- Status: accepted

## Context

Checkout asked for the same shipping details on every order, guest orders
disappeared once the shopper signed in, and a placed order was terminal: there
was no way to cancel it or to buy the same basket again. Separately, the
confirmation page keyed only on the order id, so anyone holding the URL could
read a stranger's name, phone, and address.

## Decision

- New `address` table scoped to a user, with exactly one default enforced in a
  transaction whenever a default is set, created, or deleted. Deleting the
  default promotes another address so checkout always has something to prefill.
- Checkout prefills from the default address, then the most recent order, then
  the profile name, and can save a new address as part of the order
  transaction.
- `orders.guestId` records the guest cart cookie at checkout, and
  `claimGuestOrders` runs in the Auth.js `signIn` callback so a guest order
  appears in `/account/orders` after the shopper signs in. Matching on the
  cookie rather than the email avoids trusting an unverified address.
- `cancelOrderAction` moves a `placed` order to `cancelled`, stamps
  `cancelledAt`, and restores stock in the same transaction. `canCancelOrder`
  is a pure helper so the rule is unit tested rather than embedded in the
  action.
- `reorderAction` adds an order's lines back to the cart, clamping to current
  stock and skipping deleted products, and reports how many lines it skipped.
- Confirmation access is session ownership or the `noom_last_order` cookie, and
  nothing else.

## Consequences

- A guest who clears cookies before signing in cannot claim their order. That
  is accepted: the alternative is trusting an email address nobody verified.
- Cancellation is shopper-initiated only; there is no admin surface, which
  stays consistent with the shopper-only scope.
