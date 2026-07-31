/**
 * Per-action rate limit budgets. Each is a fixed window, not a sliding one,
 * so a burst right at a window boundary can admit close to `2 * limit`
 * requests — acceptable for slowing down brute force and script abuse, not a
 * hard guarantee.
 */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 5 * 60 * 1000 },
  register: { limit: 5, windowMs: 15 * 60 * 1000 },
  magicLinkRequest: { limit: 5, windowMs: 15 * 60 * 1000 },
  magicLinkConfirm: { limit: 10, windowMs: 15 * 60 * 1000 },
  passwordResetRequest: { limit: 5, windowMs: 15 * 60 * 1000 },
  passwordResetConfirm: { limit: 10, windowMs: 15 * 60 * 1000 },
  review: { limit: 20, windowMs: 60 * 60 * 1000 },
  // Reporting is soft UX only; keep abuse from filling the table.
  reviewReport: { limit: 10, windowMs: 60 * 60 * 1000 },
  verifyEmailResend: { limit: 3, windowMs: 15 * 60 * 1000 },
  // Guests may mistype; keep this higher than login but still slow enough to
  // blunt enumeration of order ids against an email.
  orderLookup: { limit: 10, windowMs: 15 * 60 * 1000 },
  stockSubscribe: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
