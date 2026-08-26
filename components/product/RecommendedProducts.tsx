'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';

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
        const { getRecommendedProductsAction } = await import('@/app/actions/recommendations');
        const next = await getRecommendedProductsAction(currentSlug);
        if (!cancelled) setRelated(next);
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
