import { describe, expect, it } from 'vitest';
import { recommendProducts } from './recommend';
import type { CatalogProduct } from './queries';

function p(partial: Partial<CatalogProduct> & { slug: string; collections: CatalogProduct['collections'] }): CatalogProduct {
  return {
    id: partial.slug,
    name: partial.slug,
    price: 1,
    image: '/x.jpg',
    createdAt: partial.createdAt ?? 0,
    ...partial,
  };
}

describe('recommendProducts', () => {
  it('prefers shared collection over unrelated catalog head', () => {
    const catalog = [
      p({ slug: 'a', collections: ['tees'], createdAt: 1 }),
      p({ slug: 'unrelated-old', collections: ['pants'], createdAt: 9 }),
      p({ slug: 'related', collections: ['tees'], createdAt: 2 }),
      p({ slug: 'also-unrelated', collections: ['tanks'], createdAt: 8 }),
    ];
    const recs = recommendProducts(catalog, 'a', 2);
    expect(recs[0].slug).toBe('related');
    expect(recs.map((r) => r.slug)).not.toEqual(['unrelated-old', 'related']);
  });
});
