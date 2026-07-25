'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import LazyVideo from '@/components/ui/LazyVideo';
import {
  DESKTOP_CHIPS,
  MOBILE_CHIPS,
  DISABLED_MOBILE,
  SORT_OPTIONS,
  type FilterChip,
  type SortOption,
  chipToParam,
  paramToChip,
  chipToCollectionSlugs,
  productInCollections,
  COLLECTION_SLUG,
} from '@/lib/products/collections';
import type { CatalogProduct } from '@/lib/products/queries';

function ProductSkeletonGrid() {
  return (
    <div className="pgrid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="collections-skel-card">
          <div className="collections-skel-media" />
          <div className="collections-skel-line" />
          <div className="collections-skel-line collections-skel-line--short" />
        </div>
      ))}
    </div>
  );
}

function CollectionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('Popular');
  const prevChipRef = useRef<FilterChip | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const chips: readonly FilterChip[] = isMobile ? MOBILE_CHIPS : DESKTOP_CHIPS;
  const categoryParam = searchParams.get('category') || '';
  const activeChip = paramToChip(categoryParam || '', isMobile);

  useEffect(() => {
    if (prevChipRef.current && prevChipRef.current !== activeChip) {
      setSortBy('Popular');
    }
    prevChipRef.current = activeChip;
  }, [activeChip]);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const { loadClientCatalog } = await import('@/lib/products/client-catalog');
      const catalog = await loadClientCatalog();
      setProducts(catalog);
    } catch (err) {
      console.error('[collections] load failed:', err);
      setError('Could not load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChipClick = (chip: FilterChip) => {
    if (isMobile && DISABLED_MOBILE.includes(chip)) return;
    const params = new URLSearchParams(searchParams.toString());
    const param = chipToParam(chip);
    if (!param) {
      params.delete('category');
    } else {
      params.set('category', param);
    }
    const qs = params.toString();
    router.replace(qs ? `/collections?${qs}` : '/collections', { scroll: false });
  };

  const required = chipToCollectionSlugs(activeChip);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (required === 'ALL') return true;
      const ok = productInCollections(p.collections, required);
      if (!ok && p.collections.length === 0 && process.env.NODE_ENV !== 'production') {
        // already warned at catalog load
      }
      return ok;
    });
  }, [products, required]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'Price: Low to High') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'Price: High to Low') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else {
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return list;
  }, [filteredProducts, sortBy]);

  const titleForChip =
    activeChip === 'Latest Drop'
      ? 'Latest Drop'
      : activeChip === 'View all' || activeChip === 'All Products'
        ? 'All Products'
        : activeChip;

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-clip">
      <Navbar />

      <section className="collections-hero relative z-[1] w-full overflow-hidden">
        <LazyVideo
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 hidden md:block"
          src="/assets/COLLECTION_MOTION_BANNER.mp4"
          poster="/assets/empty_centre.jpg"
          rootMargin="0px"
          deferMs={2000}
        />
        <LazyVideo
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] opacity-100 md:hidden"
          src="/assets/FOR_MOBILE_ST_COLLECTION.mp4"
          poster="/banners/st-mobile-banner.jpg"
          rootMargin="0px"
          deferMs={2000}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/40 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none bg-gradient-to-t from-[var(--page-bg)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-[1] px-4 md:px-6 pb-10 md:pb-14 w-full max-w-[min(95vw,2400px)] mx-auto">
          <span className="listing__eyebrow block mb-3">Collection / SS26</span>
          <h1 className="listing__title text-white drop-shadow-sm">{titleForChip}</h1>
          <p className="collections-hero__sub">
            {required === 'ALL'
              ? 'Full archive — every active piece.'
              : required[0] === COLLECTION_SLUG.LATEST
                ? 'Curated from the current drop only.'
                : 'Members of this collection only.'}
          </p>
        </div>
      </section>

      <main className="relative z-[1] pb-10 md:pb-14 w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
        <div className="listing listing--collections">
          <div className="chips" role="tablist" aria-label="Collection filters">
            {chips.map((c) => {
              const isDisabled = isMobile && DISABLED_MOBILE.includes(c);
              const isActive = activeChip === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`chip ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleChipClick(c)}
                  disabled={isDisabled}
                >
                  {isDisabled ? `${c} (Soon)` : c}
                </button>
              );
            })}
          </div>

          <div className="chips chips--sort" role="group" aria-label="Sort products">
            <span className="chips__label">Sort</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${sortBy === s ? 'active' : ''}`}
                onClick={() => setSortBy(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <ProductSkeletonGrid />
          ) : error ? (
            <div className="collections-state">
              <p className="listing__empty">{error}</p>
              <button type="button" className="contact-cta__btn" onClick={() => loadProducts()}>
                Retry
              </button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="collections-state">
              <p className="listing__empty">No products in this collection yet.</p>
              <Link href="/collections?category=all" className="contact-cta__btn">
                View all products
              </Link>
            </div>
          ) : (
            <>
              <p className="collections-count">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
              <div className="pgrid">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      slug: product.slug,
                      image: product.image,
                      image2: product.image2,
                      metadata: product.metadata as any,
                    }}
                    gallery={true}
                  />
                ))}
              </div>
              <div className="collections-discover">
                <Link href="/lookbook" className="pill pill--ghost">
                  Discover more
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent">
          <div className="w-full max-w-[min(95vw,2400px)] mx-auto px-4 pt-32">
            <ProductSkeletonGrid />
          </div>
        </div>
      }
    >
      <CollectionsInner />
    </Suspense>
  );
}
