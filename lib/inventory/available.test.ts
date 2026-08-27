import { describe, expect, it } from 'vitest';
import { netAvailable } from './net-available';

describe('available quantity = on_hand - active reservations', () => {
  it('positive stock minus holds', () => {
    expect(netAvailable(8, 2)).toBe(6);
  });

  it('explicit zero stays zero', () => {
    expect(netAvailable(0, 0)).toBe(0);
  });

  it('reservation race never goes negative', () => {
    expect(netAvailable(1, 3)).toBe(0);
  });
});
