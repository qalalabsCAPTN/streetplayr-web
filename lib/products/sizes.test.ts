import { describe, expect, it } from 'vitest';
import {
  APPAREL_SIZE_ORDER,
  isRemovedApparelSize,
  normalizeSizeLabel,
  sizeFromSku,
  sortApparelSizes,
} from './sizes';

describe('APPAREL_SIZE_ORDER', () => {
  it('is XS → S → M → L → XL → 2XL', () => {
    expect([...APPAREL_SIZE_ORDER]).toEqual(['XS', 'S', 'M', 'L', 'XL', '2XL']);
  });
});

describe('normalizeSizeLabel', () => {
  it('uppercases, trims, and strips spacing', () => {
    expect(normalizeSizeLabel('  m ')).toBe('M');
    expect(normalizeSizeLabel('2 xl')).toBe('2XL');
    expect(normalizeSizeLabel('xxl')).toBe('2XL');
  });
});

describe('sizeFromSku', () => {
  it('maps UniCommerce SKU suffix to size', () => {
    expect(sizeFromSku('PS-TEE-CRT-WHT-S')).toBe('S');
    expect(sizeFromSku('PS-TEE-CRT-WHT-2XL')).toBe('2XL');
    expect(sizeFromSku('PS-TEE-CRT-WHT-XXL')).toBe('2XL');
  });
});

describe('isRemovedApparelSize', () => {
  it('filters XXS / 3XL / 4XL, not 2XL', () => {
    expect(isRemovedApparelSize('XXS')).toBe(true);
    expect(isRemovedApparelSize('3XL')).toBe(true);
    expect(isRemovedApparelSize('2XL')).toBe(false);
    expect(isRemovedApparelSize('XXL')).toBe(false);
  });

  it('keeps standard apparel sizes', () => {
    expect(isRemovedApparelSize('XS')).toBe(false);
    expect(isRemovedApparelSize('S')).toBe(false);
    expect(isRemovedApparelSize('M')).toBe(false);
    expect(isRemovedApparelSize('L')).toBe(false);
    expect(isRemovedApparelSize('XL')).toBe(false);
    expect(isRemovedApparelSize('2XL')).toBe(false);
  });
});

describe('sortApparelSizes', () => {
  it('sorts jumble including 2XL when the size exists', () => {
    expect(sortApparelSizes(['XS', 'XL', 'S', 'M', 'L', '2XL'])).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
      '2XL',
    ]);
  });

  it('does not invent 2XL when it is absent', () => {
    expect(sortApparelSizes(['S', 'M', 'L'])).toEqual(['S', 'M', 'L']);
  });

  it('collapses XXL into 2XL', () => {
    expect(sortApparelSizes(['S', 'XXL', 'M', '2xl', 'L'])).toEqual([
      'S',
      'M',
      'L',
      '2XL',
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

  it('places unknown sizes after known order', () => {
    expect(sortApparelSizes(['OS', 'L', '28', 'S'])).toEqual([
      'S',
      'L',
      '28',
      'OS',
    ]);
  });
});
