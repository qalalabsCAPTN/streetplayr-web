import { describe, expect, it } from 'vitest';
import { productMatchesQuery } from './search';
import { recommendProducts } from './recommend';
import type { CatalogProduct } from './queries';
import {
  filterStreetPlayrCatalogProducts,
  isStreetPlayrCatalogMetadata,
  isStreetPlayrStorefrontRow,
} from '@/src/integrations/unicommerce/streetplayr-brand';

function catalogProduct(
  slug: string,
  brand: string,
  collections: CatalogProduct['collections'] = ['tees']
): CatalogProduct {
  return {
    id: slug,
    name: slug === 'adidas-superstar' ? 'Adidas Superstar' : slug === 'playr-jersey' ? 'playR Jersey' : 'StreetPlayR Tee',
    price: 1999,
    slug,
    image: '/assets/products/ctt-waffle/image-1.webp',
    image2: '/assets/products/ctt-waffle/image-2.webp',
    description: 'ok',
    collections,
    createdAt: 1,
    variants: [{ id: `${slug}-s`, price: 1999, size: 'S' }],
    metadata: { brand, gallery_images: ['/a.jpg', '/b.jpg'] },
  };
}

const street = catalogProduct('street-tee', 'playR STREET');
const brandB = catalogProduct('adidas-superstar', 'Adidas');
const brandC = catalogProduct('playr-jersey', 'playR');
const mixed = [street, brandB, brandC];

describe('StreetPlayR storefront isolation', () => {
  it('search never returns Brand B or Brand C', () => {
    const catalog = filterStreetPlayrCatalogProducts(mixed);
    const adidasHits = catalog.filter((p) => productMatchesQuery(p, 'adidas'));
    const playrHits = catalog.filter((p) => productMatchesQuery(p, 'jersey'));
    const streetHits = catalog.filter((p) => productMatchesQuery(p, 'streetplayr'));
    expect(catalog.map((p) => p.slug)).toEqual(['street-tee']);
    expect(adidasHits).toEqual([]);
    expect(playrHits).toEqual([]);
    expect(streetHits.map((p) => p.slug)).toEqual(['street-tee']);
  });

  it('collections never include other brands', () => {
    const catalog = filterStreetPlayrCatalogProducts(mixed);
    expect(catalog.filter((p) => p.collections.includes('tees')).map((p) => p.slug)).toEqual([
      'street-tee',
    ]);
  });

  it('recommendations never include other brands', () => {
    const extra = catalogProduct('street-tank', 'playR STREET', ['tanks']);
    const catalog = filterStreetPlayrCatalogProducts([...mixed, extra]);
    const recs = recommendProducts(catalog, 'street-tee', 4);
    expect(recs.every((p) => isStreetPlayrCatalogMetadata(p.metadata))).toBe(true);
    expect(recs.map((p) => p.slug)).not.toContain('adidas-superstar');
    expect(recs.map((p) => p.slug)).not.toContain('playr-jersey');
  });

  it('PDP lookup rejects foreign metadata.brand', () => {
    expect(isStreetPlayrCatalogMetadata(brandB.metadata)).toBe(false);
    expect(isStreetPlayrCatalogMetadata(brandC.metadata)).toBe(false);
    expect(isStreetPlayrCatalogMetadata(street.metadata)).toBe(true);
  });

  it('merchant feed is built only from filtered catalog', () => {
    const catalog = filterStreetPlayrCatalogProducts(mixed);
    const feedIds = catalog.map((p) => p.id);
    expect(feedIds).toEqual(['street-tee']);
    expect(feedIds).not.toContain('adidas-superstar');
  });

  it('cart validation rejects other-brand brand_id and Adidas metadata', () => {
    const streetId = 'brand-streetplayr';
    expect(isStreetPlayrStorefrontRow('brand-adidas', streetId, brandB.metadata)).toBe(false);
    expect(isStreetPlayrStorefrontRow(streetId, streetId, brandB.metadata)).toBe(false);
    expect(isStreetPlayrStorefrontRow(streetId, streetId, street.metadata)).toBe(true);
  });
});
