import { describe, expect, it } from 'vitest';
import {
  applySizeClick,
  initialVariantId,
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

  it('zero-stock existing size is sold out, not missing', () => {
    expect(sizeExists(variants, 'S')).toBe(true);
    expect(sizeIsSoldOut(variants, 'S')).toBe(true);
    expect(sizeExists(variants, 'M')).toBe(true);
    expect(sizeIsSoldOut(variants, 'M')).toBe(false);
  });
});

