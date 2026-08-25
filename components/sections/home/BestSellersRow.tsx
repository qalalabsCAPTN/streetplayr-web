import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import type { CatalogProduct } from '@/lib/products/queries';

export default function BestSellersRow({ products }: { products: CatalogProduct[] }) {
  if (!products.length) return null;
  const row = products.slice(0, 3);

  return (
    <section className="panel panel--flat best-sellers-row">
      <div className="panel__head">
        <h2 className="panel__title">Best Sellers</h2>
        <Link href="/collections" className="pill pill--ghost panel__more-desktop">
          View all
        </Link>
      </div>
      <div className="best-sellers-row__grid">
        {row.map((p) => (
          <ProductCard
            key={p.slug}
            product={{
              id: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              image: p.image,
              image2: p.image2,
              category: p.collections[0],
              variants: p.variants,
              metadata: p.metadata,
            }}
            gallery
          />
        ))}
      </div>
    </section>
  );
}
