import type { CatalogProduct } from '@/lib/products/queries';

/**
 * Deterministic related products: same collection first, then newest.
 */
export function recommendProducts(
  catalog: CatalogProduct[],
  currentSlug: string,
  limit = 4
): CatalogProduct[] {
  const current = catalog.find((p) => p.slug === currentSlug);
  const rest = catalog.filter((p) => p.slug !== currentSlug);
  const collections = new Set(current?.collections ?? []);

  return [...rest]
    .sort((a, b) => {
      const ao = (a.collections ?? []).filter((c) => collections.has(c)).length;
      const bo = (b.collections ?? []).filter((c) => collections.has(c)).length;
      if (bo !== ao) return bo - ao;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    })
    .slice(0, limit);
}
