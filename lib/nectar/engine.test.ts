import { describe, it, expect } from 'vitest';
import { deriveTier, getProgress, getTierMultiplier, getStreakLabel, type Tier } from './engine';

describe('Nectar Engine - deriveTier', () => {
  it('returns STREET when SPRR is less than 500', () => {
    expect(deriveTier(0)).toBe('STREET');
    expect(deriveTier(100)).toBe('STREET');
    expect(deriveTier(499)).toBe('STREET');
  });

  it('returns PLAYER when SPRR is between 500 and 4999 inclusive', () => {
    expect(deriveTier(500)).toBe('PLAYER');
    expect(deriveTier(2500)).toBe('PLAYER');
    expect(deriveTier(4999)).toBe('PLAYER');
  });

  it('returns LEGEND when SPRR is 5000 or greater', () => {
    expect(deriveTier(5000)).toBe('LEGEND');
    expect(deriveTier(10000)).toBe('LEGEND');
  });
});

describe('Nectar Engine - getProgress', () => {
  it('returns 50% progress toward PLAYER when SPRR is 250', () => {
    const result = getProgress(250);
    expect(result.tier).toBe('STREET');
    expect(result.progress).toBe(0.5); // (250 - 0) / (500 - 0)
    expect(result.next).toBe('PLAYER');
  });

  it('returns 0% progress toward PLAYER when SPRR is 0', () => {
    const result = getProgress(0);
    expect(result.tier).toBe('STREET');
    expect(result.progress).toBe(0);
    expect(result.next).toBe('PLAYER');
  });

  it('returns 100% progress toward LEGEND when SPRR is 4999', () => {
    const result = getProgress(4999);
    expect(result.tier).toBe('PLAYER');
    // progress is (4999 - 500) / (5000 - 500) = 4499 / 4500
    expect(result.progress).toBeCloseTo(0.9998, 4);
    expect(result.next).toBe('LEGEND');
  });

  it('returns 100% progress (1.0) and next as null when tier is LEGEND', () => {
    const result = getProgress(5000);
    expect(result.tier).toBe('LEGEND');
    expect(result.progress).toBe(1);
    expect(result.next).toBeNull();
  });
});

describe('Nectar Engine - getTierMultiplier', () => {
  it('returns 1.0 multiplier for STREET tier', () => {
    expect(getTierMultiplier('STREET')).toBe(1.0);
  });

  it('returns 1.25 multiplier for PLAYER tier', () => {
    expect(getTierMultiplier('PLAYER')).toBe(1.25);
  });

  it('returns 1.5 multiplier for LEGEND tier', () => {
    expect(getTierMultiplier('LEGEND')).toBe(1.5);
  });

  it('returns 1.0 multiplier for any invalid/unknown tier', () => {
    // Cast to any to test fallback/default behavior
    expect(getTierMultiplier('UNKNOWN' as unknown as Tier)).toBe(1.0);
  });
});

describe('Nectar Engine - getStreakLabel', () => {
  it('returns Start Your Streak when days is 0', () => {
    expect(getStreakLabel(0)).toBe('Start Your Streak');
  });

  it('returns Getting Started when days is between 1 and 2', () => {
    expect(getStreakLabel(1)).toBe('Getting Started');
    expect(getStreakLabel(2)).toBe('Getting Started');
  });

  it('returns Building when days is between 3 and 6', () => {
    expect(getStreakLabel(3)).toBe('Building');
    expect(getStreakLabel(6)).toBe('Building');
  });

  it('returns Consistent when days is between 7 and 13', () => {
    expect(getStreakLabel(7)).toBe('Consistent');
    expect(getStreakLabel(13)).toBe('Consistent');
  });

  it('returns On Fire when days is between 14 and 29', () => {
    expect(getStreakLabel(14)).toBe('On Fire');
    expect(getStreakLabel(29)).toBe('On Fire');
  });

  it('returns Unstoppable when days is 30 or greater', () => {
    expect(getStreakLabel(30)).toBe('Unstoppable');
    expect(getStreakLabel(100)).toBe('Unstoppable');
  });
});
