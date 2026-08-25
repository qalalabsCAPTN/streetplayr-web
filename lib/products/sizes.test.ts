import { describe, expect, it } from 'vitest';
import {
  APPAREL_SIZE_ORDER,
  isRemovedApparelSize,
  normalizeSizeLabel,
  sortApparelSizes,
} from './sizes';

describe('APPAREL_SIZE_ORDER', () => {
  it('is XS → S → M → L → XL', () => {
    expect([...APPAREL_SIZE_ORDER]).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });
});

describe('normalizeSizeLabel', () => {
  it('uppercases, trims, and strips spacing', () => {
    expect(normalizeSizeLabel('  m ')).toBe('M');
    expect(normalizeSizeLabel('2 xl')).toBe('2XL');
    expect(normalizeSizeLabel('xxl')).toBe('XXL');
  });
});

describe('isRemovedApparelSize', () => {
  it('filters XXL / 2xl / xxl regardless of case or spacing', () => {
    expect(isRemovedApparelSize('XXL')).toBe(true);
    expect(isRemovedApparelSize('2xl')).toBe(true);
    expect(isRemovedApparelSize('xxl')).toBe(true);
    expect(isRemovedApparelSize(' 2XL ')).toBe(true);
    expect(isRemovedApparelSize('2 xl')).toBe(true);
  });

  it('keeps standard apparel sizes', () => {
    expect(isRemovedApparelSize('XS')).toBe(false);
    expect(isRemovedApparelSize('S')).toBe(false);
    expect(isRemovedApparelSize('M')).toBe(false);
    expect(isRemovedApparelSize('L')).toBe(false);
    expect(isRemovedApparelSize('XL')).toBe(false);
  });
});

describe('sortApparelSizes', () => {
  it('sorts a jumble XS XL S M L 2XL to XS S M L XL (2XL dropped)', () => {
    expect(sortApparelSizes(['XS', 'XL', 'S', 'M', 'L', '2XL'])).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
    ]);
  });

  it('filters XXL / 2xl / xxl', () => {
    expect(sortApparelSizes(['S', 'XXL', 'M', '2xl', 'L', 'xxl'])).toEqual([
      'S',
      'M',
      'L',
    ]);
  });

  it('collapses duplicates', () => {
    expect(sortApparelSizes(['M', 'S', 'M', 's', 'L', 'L'])).toEqual([
      'S',
      'M',
      'L',
    ]);
  });

  it('returns [] for empty input', () => {
    expect(sortApparelSizes([])).toEqual([]);
  });

  it('places unknown sizes after XS→XL in alpha order', () => {
    expect(sortApparelSizes(['OS', 'L', '28', 'S'])).toEqual([
      'S',
      'L',
      '28',
      'OS',
    ]);
  });
});
