'use client';

import { LOCAL_PRODUCTS } from '@/lib/products/data';
import ProductCard from '@/components/ui/ProductCard';

export default function RecommendedProducts({ currentSlug }: { currentSlug: string }) {
  const related = LOCAL_PRODUCTS.filter((p) => p.slug !== currentSlug)
    .slice(0, 4) // Show up to 4 recommended products
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      slug: p.slug,
      image: p.image_url,
      category: p.category.name,
      metadata: p.metadata,
      variants: p.variants.map((v) => ({ id: v.id, size: v.size })),
    }));

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
