export const BEST_SELLERS_WINDOW_DAYS = 15;
export const BEST_SELLERS_LIMIT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function bestSellersSince(now?: Date): Date {
  const base = now ?? new Date();
  return new Date(base.getTime() - BEST_SELLERS_WINDOW_DAYS * DAY_MS);
}
