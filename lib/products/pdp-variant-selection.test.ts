import { describe, expect, it } from 'vitest';
import {
  applySizeClick,
  initialVariantId,
  pdpCtaSoldOut,
  selectVariantBySize,
  sizeExists,
  sizeIsSoldOut,
  sizesFromExistingVariants,
} from './pdp-variant-selection';

const variants = [
  { id: 'var-xs', size: 'XS', stockQuantity: 5 },
  { id: 'var-s', size: 'S', stockQuantity: 0 },
  { id: 'var-m', size: 'M', stockQuantity: 8 },
  { id: 'var-l', size: 'L', stockQuantity: 0 },
  { id: 'var-xl', size: 'XL', stockQuantity: 3 },
];

describe('PDP size selection uses product_variant.id', () => {
  it('XS → S is a no-op when S is sold out; S → M changes id', () => {
    const afterXs = applySizeClick(variants, 'var-xs', 'S');
    expect(afterXs).toBe('var-xs');
    const withSInStock = variants.map((v) =>
      v.id === 'var-s' ? { ...v, stockQuantity: 2 } : v
    );
    expect(applySizeClick(withSInStock, 'var-xs', 'S')).toBe('var-s');
    expect(applySizeClick(withSInStock, 'var-s', 'M')).toBe('var-m');
    expect(applySizeClick(withSInStock, 'var-m', 'L')).toBe('var-m');
    expect(applySizeClick(withSInStock, 'var-m', 'XL')).toBe('var-xl');
    expect(applySizeClick(withSInStock, 'var-xl', 'XS')).toBe('var-xs');
  });

  it('defaults to the leftmost displayed in-stock size, not array order', () => {
    const unordered = [
      { id: 'var-m', size: 'M', stockQuantity: 8 },
      { id: 'var-xl', size: 'XL', stockQuantity: 3 },
      { id: 'var-s', size: 'S', stockQuantity: 4 },
    ];
    expect(initialVariantId(unordered)).toBe('var-s');
    expect(sizesFromExistingVariants(unordered)).toEqual(['S', 'M', 'XL']);
  });

  it('cycle XS S M L XL XS when all in stock', () => {
    const all = variants.map((v) => ({ ...v, stockQuantity: 2 }));
    let id = initialVariantId(all);
    expect(id).toBe('var-xs');
    id = applySizeClick(all, id, 'S');
    expect(id).toBe('var-s');
    expect(selectVariantBySize(all, 'S')?.id).toBe('var-s');
    id = applySizeClick(all, id, 'M');
    expect(id).toBe('var-m');
    id = applySizeClick(all, id, 'L');
    expect(id).toBe('var-l');
    id = applySizeClick(all, id, 'XL');
    expect(id).toBe('var-xl');
    id = applySizeClick(all, id, 'XS');
    expect(id).toBe('var-xs');
  });

  it('Add to Bag / Buy Now resolve the selected variant id, not a default XS', () => {
    const all = variants.map((v) => ({ ...v, stockQuantity: 2 }));
    const selected = applySizeClick(all, 'var-xs', 'M');
    expect(selected).toBe('var-m');
    expect(selected).not.toBe('var-xs');
  });
});

describe('size existence vs inventory', () => {
  it('hides 2XL when the product has no 2XL variant', () => {
    expect(sizeExists(variants, '2XL')).toBe(false);
    expect(sizesFromExistingVariants(variants)).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  it('shows 2XL only when a 2XL variant exists', () => {
    const with2xl = [...variants, { id: 'var-2xl', size: '2XL', stockQuantity: 1 }];
    expect(sizeExists(with2xl, '2XL')).toBe(true);
    expect(sizeIsSoldOut(with2xl, '2XL')).toBe(false);
    expect(sizesFromExistingVariants(with2xl)).toEqual(['XS', 'S', 'M', 'L', 'XL', '2XL']);
  });

  it('XL → 2XL uses 2XL variant id, never XL', () => {
    const with2xl = [
      ...variants.map((v) => ({ ...v, stockQuantity: 2 })),
      { id: 'var-2xl', size: '2XL', stockQuantity: 4 },
    ];
    expect(applySizeClick(with2xl, 'var-xl', '2XL')).toBe('var-2xl');
    expect(applySizeClick(with2xl, 'var-2xl', 'XL')).toBe('var-xl');
    expect(applySizeClick(with2xl, 'var-2xl', 'XS')).toBe('var-xs');
  });

  it('STAAR-style S-XL catalog never invents XS or 2XL', () => {
    const tank = [
      { id: 't-s', size: 'S', stockQuantity: 3 },
      { id: 't-m', size: 'M', stockQuantity: 0 },
      { id: 't-l', size: 'L', stockQuantity: 2 },
      { id: 't-xl', size: 'XL', stockQuantity: 1 },
    ];
    expect(sizesFromExistingVariants(tank)).toEqual(['S', 'M', 'L', 'XL']);
    expect(sizeExists(tank, 'XS')).toBe(false);
    expect(sizeExists(tank, '2XL')).toBe(false);
    expect(sizeIsSoldOut(tank, 'M')).toBe(true);
    expect(applySizeClick(tank, 't-s', '2XL')).toBe('t-s');
  });

  it('XL → 2XL uses 2XL variant id, never XL', () => {
    const with2xl = [
      ...variants.map((v) => ({ ...v, stockQuantity: 2 })),
      { id: 'var-2xl', size: '2XL', stockQuantity: 4 },
    ];
    expect(applySizeClick(with2xl, 'var-xl', '2XL')).toBe('var-2xl');
    expect(applySizeClick(with2xl, 'var-2xl', 'XL')).toBe('var-xl');
    expect(applySizeClick(with2xl, 'var-2xl', 'XS')).toBe('var-xs');
  });

  it('STAAR-style S-XL catalog never invents XS or 2XL', () => {
    const tank = [
      { id: 't-s', size: 'S', stockQuantity: 3 },
      { id: 't-m', size: 'M', stockQuantity: 0 },
      { id: 't-l', size: 'L', stockQuantity: 2 },
      { id: 't-xl', size: 'XL', stockQuantity: 1 },
    ];
    expect(sizesFromExistingVariants(tank)).toEqual(['S', 'M', 'L', 'XL']);
    expect(sizeExists(tank, 'XS')).toBe(false);
    expect(sizeExists(tank, '2XL')).toBe(false);
    expect(sizeIsSoldOut(tank, 'M')).toBe(true);
    expect(applySizeClick(tank, 't-s', '2XL')).toBe('t-s');
  });

  it('zero-stock existing size is sold out, not missing', () => {
    expect(sizeExists(variants, 'S')).toBe(true);
    expect(sizeIsSoldOut(variants, 'S')).toBe(true);
    expect(sizeExists(variants, 'M')).toBe(true);
    expect(sizeIsSoldOut(variants, 'M')).toBe(false);
  });
});

describe('PDP CTA uses selected variant, sold-out disables', () => {
  it('empty selection is not sold-out (prompt, do not submit XS)', () => {
    expect(pdpCtaSoldOut(undefined)).toBe(false);
  });

  it('in-stock selected variant keeps CTA enabled', () => {
    expect(pdpCtaSoldOut({ id: 'var-m', size: 'M', stockQuantity: 8 })).toBe(false);
  });

  it('zero-stock selected variant disables CTA', () => {
    expect(pdpCtaSoldOut({ id: 'var-s', size: 'S', stockQuantity: 0 })).toBe(true);
  });

  it('sticky CTA follows applySizeClick id, never stuck on XS', () => {
    const all = variants.map((v) => ({ ...v, stockQuantity: 2 }));
    const afterM = applySizeClick(all, 'var-xs', 'M');
    expect(afterM).toBe('var-m');
    expect(pdpCtaSoldOut(selectVariantBySize(all, 'M'))).toBe(false);
  });
});


