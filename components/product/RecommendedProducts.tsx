'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import type { CatalogProduct } from '@/lib/products/queries';

export default function RecommendedProducts({ currentSlug }: { currentSlug: string }) {
  const [related, setRelated] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      slug: string;
      image: string;
      category?: string;
      variants?: { id: string; size: string }[];
    }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadClientCatalog } = await import('@/lib/products/client-catalog');
        const catalog = await loadClientCatalog();
        if (cancelled) return;
        setRelated(
          catalog
            .filter((p: CatalogProduct) => p.slug !== currentSlug)
            .slice(0, 4)
            .map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              slug: p.slug,
              image: p.image,
              category: p.collections[0],
              variants: (p.variants ?? []).map((v) => ({ id: v.id, size: v.size })),
            }))
        );
      } catch (err) {
        console.warn('[RecommendedProducts] catalog load failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  if (related.length === 0) return null;

  return (
    <section className="pdp-related">
      <div className="pdp-related__head">
        <h2 className="pdp-related__title">You May Also Like</h2>
      </div>

      <div className="pgrid">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} gallery={true} />
        ))}
      </div>
    </section>
  );
}
