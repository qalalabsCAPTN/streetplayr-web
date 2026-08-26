'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import { productMatchesQuery } from '@/lib/products/search';
import type { CatalogProduct } from '@/lib/products/queries';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadClientCatalog } = await import('@/lib/products/client-catalog');
        const products = await loadClientCatalog();
        if (!cancelled) setCatalog(products);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = (catalog ?? []).filter((p) => productMatchesQuery(p, q));
  const sorted = [...results].sort((a, b) => {
    const sort = params.get('sort') ?? 'newest';
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });

  return (
    <>
      <Navbar />
      <div className="listing">
        <h1 className="font-display uppercase tracking-tight text-3xl mb-4">Search</h1>
        <p className="font-mono text-xs uppercase tracking-widest mb-8">
          {q ? `Query: ${q}` : 'Type in the header search'}
        </p>
        {q && (
          <p className="font-mono text-xs mb-6">
            Sort:{' '}
            <a href={`/search?q=${encodeURIComponent(q)}&sort=newest`}>newest</a>
            {' · '}
            <a href={`/search?q=${encodeURIComponent(q)}&sort=price-asc`}>price low</a>
            {' · '}
            <a href={`/search?q=${encodeURIComponent(q)}&sort=price-desc`}>price high</a>
          </p>
        )}
        {!loaded && <p className="font-mono text-xs">Loading catalog…</p>}
        {loaded && q && sorted.length === 0 && (
          <p className="listing__empty">No products matched that search.</p>
        )}
        <div className="pgrid">
          {sorted.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                slug: product.slug,
                image: product.image,
                category: product.collections[0],
                variants: (product.variants ?? []).map((v) => ({ id: v.id, size: v.size })),
              }}
              gallery={true}
            />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <SearchResults />
    </Suspense>
  );
}
