import { describe, expect, it } from 'vitest';
import {
  UNICOMMERCE_STREETPLAYR_BRAND,
  filterStreetPlayrCatalogProducts,
  filterStreetPlayrUnicommerceItems,
  isStreetPlayrCatalogMetadata,
  isStreetPlayrStorefrontRow,
  isStreetPlayrUnicommerceBrand,
} from './streetplayr-brand';

describe('isStreetPlayrUnicommerceBrand', () => {
  it('accepts live UniCommerce Brand = playR STREET', () => {
    expect(UNICOMMERCE_STREETPLAYR_BRAND).toBe('playR STREET');
    expect(isStreetPlayrUnicommerceBrand('playR STREET')).toBe(true);
    expect(isStreetPlayrUnicommerceBrand('playR STREET®')).toBe(true);
  });

  it('accepts public name StreetPlayR if UniCommerce is renamed', () => {
    expect(isStreetPlayrUnicommerceBrand('StreetPlayR')).toBe(true);
    expect(isStreetPlayrUnicommerceBrand('streetplayr')).toBe(true);
  });

  it('rejects playR sports, collabs, Adidas, and empty', () => {
    expect(isStreetPlayrUnicommerceBrand('playR')).toBe(false);
    expect(isStreetPlayrUnicommerceBrand('playR x Gujarat Titans')).toBe(false);
    expect(isStreetPlayrUnicommerceBrand('Adidas')).toBe(false);
    expect(isStreetPlayrUnicommerceBrand('Adidas x Messi')).toBe(false);
    expect(isStreetPlayrUnicommerceBrand('')).toBe(false);
    expect(isStreetPlayrUnicommerceBrand(undefined)).toBe(false);
  });
});

describe('filterStreetPlayrUnicommerceItems', () => {
  it('keeps only StreetPlayR when mixed with Brand B and Brand C', () => {
    const { kept, skipped } = filterStreetPlayrUnicommerceItems([
      { sku: 'sp-1', brand: 'playR STREET' },
      { sku: 'b-1', brand: 'Adidas' },
      { sku: 'c-1', brand: 'playR' },
    ]);
    expect(kept.map((i) => i.sku)).toEqual(['sp-1']);
    expect(skipped).toBe(2);
  });
});

describe('isStreetPlayrCatalogMetadata', () => {
  it('excludes foreign metadata.brand even if row leaked into streetplayr brand_id', () => {
    expect(isStreetPlayrCatalogMetadata({ brand: 'Adidas' })).toBe(false);
    expect(isStreetPlayrCatalogMetadata({ brand: 'playR STREET' })).toBe(true);
    expect(isStreetPlayrCatalogMetadata({})).toBe(true);
  });
});

describe('isStreetPlayrStorefrontRow', () => {
  const streetId = 'brand-streetplayr';
  it('rejects other brand_id even when metadata says playR STREET', () => {
    expect(isStreetPlayrStorefrontRow('brand-adidas', streetId, { brand: 'playR STREET' })).toBe(false);
  });
  it('rejects streetplayr brand_id with Adidas metadata', () => {
    expect(isStreetPlayrStorefrontRow(streetId, streetId, { brand: 'Adidas' })).toBe(false);
  });
  it('accepts matching brand_id and playR STREET metadata', () => {
    expect(isStreetPlayrStorefrontRow(streetId, streetId, { brand: 'playR STREET' })).toBe(true);
  });
});

describe('filterStreetPlayrCatalogProducts', () => {
  it('drops Brand B and Brand C from a mixed catalog array', () => {
    const kept = filterStreetPlayrCatalogProducts([
      { slug: 'sp', metadata: { brand: 'playR STREET' } },
      { slug: 'b', metadata: { brand: 'Adidas' } },
      { slug: 'c', metadata: { brand: 'playR' } },
    ]);
    expect(kept.map((p) => p.slug)).toEqual(['sp']);
  });
});
