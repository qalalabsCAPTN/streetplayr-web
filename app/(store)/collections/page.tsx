'use client';

import { useState, useEffect, Suspense, useMemo, useRef, useSyncExternalStore } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
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

const MOBILE_MQ = '(max-width: 900px)';

function subscribeMobile(cb: () => void) {
  const mql = window.matchMedia(MOBILE_MQ);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

/** SSR + first client paint both false — no hydration chip-list skew. */
function useIsMobileCollections() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, () => false);
}

/** False on SSR + hydrate pass; true after client commit — no mismatch. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

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
  const isMobile = useIsMobileCollections();
  const hydrated = useHydrated();
  const [sortBy, setSortBy] = useState<SortOption>('Popular');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const prevChipRef = useRef<FilterChip | null>(null);

  const categoryParam = searchParams.get('category') || '';
  // Pre-hydrate: mobile chip semantics (View all / ALL) so mobile first paint
  // Unified detailed categories for both mobile and desktop viewports
  const activeChip = paramToChip(categoryParam || '', false);
  const activeDesktopChip = activeChip;

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

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

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
    if (sortBy === 'Price Low→High') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'Price High→Low') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === 'Newest') {
      // Sort by creation time descending (newest first)
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } else {
      // Popular: latest_drop / featured first, then recency
      const score = (p: CatalogProduct) => {
        const m = p.metadata || {};
        let s = p.createdAt ?? 0;
        if (m.latest_drop === true) s += 1e15;
        if (m.featured === true) s += 5e14;
        const pts = Number(m.points);
        if (Number.isFinite(pts)) s += pts * 1e6;
        return s;
      };
      list.sort((a, b) => score(b) - score(a));
    }
    return list;
  }, [filteredProducts, sortBy]);

  const titleForChip =
    activeChip === 'View all' || activeChip === 'All Products'
      ? 'All Products'
      : activeChip;

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-clip">
      <Navbar />

      <section className="collections-hero relative z-[1] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100"
          src="/assets/empty_centre.jpg"
          alt=""
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
          <div className="collections-toolbar">
            {/* Category Pills Row */}
            <div
              className="chips chips--collections-categories"
              role="tablist"
              aria-label="Collection filters"
            >
              {DESKTOP_CHIPS.map((c) => {
                const isActive = activeDesktopChip === c && (!categoryParam || categoryParam === 'all' ? false : true);
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleChipClick(c)}
                  >
                    <span className="chip__bullet" aria-hidden="true">
                      {isActive ? (
                        <svg className="chip__bullet-svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="currentColor"/></svg>
                      ) : (
                        <svg className="chip__bullet-svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
                      )}
                    </span>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Utility Controls Row */}
            <div className="collections-utility-row">
              {/* View All Pill */}
              <button
                type="button"
                className={`chip chip--view-all ${!categoryParam || categoryParam === 'all' ? 'active' : ''}`}
                onClick={() => handleChipClick('View all')}
              >
                <span className="chip__bullet" aria-hidden="true">
                  {!categoryParam || categoryParam === 'all' ? (
                    <svg className="chip__bullet-svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="currentColor"/></svg>
                  ) : (
                    <svg className="chip__bullet-svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
                  )}
                </span>
                <span>View All</span>
              </button>

            <div
              ref={sortRef}
              className={`collections-sort${sortOpen ? ' is-open' : ''}`}
              onMouseEnter={() => {
                if (!isMobile) setSortOpen(true);
              }}
              onMouseLeave={() => {
                if (!isMobile) setSortOpen(false);
              }}
            >
              <button
                type="button"
                className="collections-sort__trigger"
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                aria-controls="collections-sort-menu"
                onClick={() => setSortOpen((o) => !o)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSortOpen(true);
                    requestAnimationFrame(() => {
                      sortRef.current
                        ?.querySelector<HTMLButtonElement>('.collections-sort__option')
                        ?.focus();
                    });
                  }
                }}
              >
                <span className="collections-sort__text">Sort ▾ {sortBy}</span>
              </button>
              <ul
                id="collections-sort-menu"
                className="collections-sort__menu"
                role="menu"
                aria-label="Sort products"
                hidden={!sortOpen}
              >
                {SORT_OPTIONS.map((s) => (
                  <li key={s} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`collections-sort__option${sortBy === s ? ' is-active' : ''}`}
                      onClick={() => {
                        setSortBy(s);
                        setSortOpen(false);
                      }}
                      onKeyDown={(e) => {
                        const items = Array.from(
                          sortRef.current?.querySelectorAll<HTMLButtonElement>(
                            '.collections-sort__option',
                          ) ?? [],
                        );
                        const idx = items.indexOf(e.currentTarget);
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          items[(idx + 1) % items.length]?.focus();
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          items[(idx - 1 + items.length) % items.length]?.focus();
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          items[0]?.focus();
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          items[items.length - 1]?.focus();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setSortOpen(false);
                          sortRef.current
                            ?.querySelector<HTMLButtonElement>('.collections-sort__trigger')
                            ?.focus();
                        }
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            </div>
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
