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
    }));

  if (related.length === 0) return null;

  return (
    <section className="w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12 py-20 border-t border-white/[0.06]">
      <div className="mb-10">
        <h2 className="font-display text-[28px] md:text-[42px] uppercase leading-[0.92] text-[#eadfed]">
          You May Also Like
        </h2>
      </div>

      <div className="pgrid">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} gallery={true} />
        ))}
      </div>
    </section>
  );
}
