import { describe, expect, it } from 'vitest';
import { generateOrderNumber } from './order-number';

describe('production order numbers', () => {
  it('never uses DEMO- prefix', () => {
    const n = generateOrderNumber(new Date('2026-08-27T00:00:00.000Z'));
    expect(n.startsWith('SP-20260827-')).toBe(true);
    expect(n).not.toMatch(/DEMO-/);
  });

  it('is unique across rapid calls', () => {
    const set = new Set(Array.from({ length: 20 }, () => generateOrderNumber()));
    expect(set.size).toBe(20);
  });
});
