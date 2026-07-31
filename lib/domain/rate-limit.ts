/**
 * Pure fixed-window rate limiting helpers. A window is identified by the
 * multiple of `windowMs` that `now` falls into, so all callers within the
 * same window share one counter regardless of when in the window they land.
 */
export function windowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function isOverLimit(count: number, limit: number): boolean {
  return count > limit;
}
