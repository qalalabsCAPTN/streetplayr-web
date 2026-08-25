import { describe, expect, it } from 'vitest';
import {
  BEST_SELLERS_LIMIT,
  BEST_SELLERS_WINDOW_DAYS,
  bestSellersSince,
} from './best-sellers';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('best sellers window', () => {
  it('uses a 15-day window and a limit of 3', () => {
    expect(BEST_SELLERS_WINDOW_DAYS).toBe(15);
    expect(BEST_SELLERS_LIMIT).toBe(3);
  });

  it('returns now minus 15 days', () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const since = bestSellersSince(now);
    expect(since.toISOString()).toBe('2026-08-10T00:00:00.000Z');
    expect(now.getTime() - since.getTime()).toBe(15 * DAY_MS);
  });

  it('defaults to the current time when now is omitted', () => {
    const before = Date.now();
    const since = bestSellersSince();
    const after = Date.now();
    expect(since.getTime()).toBeGreaterThanOrEqual(before - 15 * DAY_MS);
    expect(since.getTime()).toBeLessThanOrEqual(after - 15 * DAY_MS);
  });
});
