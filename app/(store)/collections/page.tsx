'use client';

import { useState, useEffect, Suspense, useMemo, useRef, useSyncExternalStore } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import CollectionHero from '@/components/sections/collections/CollectionHero';
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

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="collections-sort__option-icon">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="collections-sort__option-icon">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="collections-sort__option-icon">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="collections-sort__option-icon">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="collections-sort__option-check">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function getSortIcon(option: string) {
  switch (option) {
    case 'Popular':
      return <StarIcon />;
    case 'Newest':
      return <ClockIcon />;
    case 'Price Low→High':
      return <TrendingUpIcon />;
    case 'Price High→Low':
      return <TrendingDownIcon />;
    default:
      return null;
  }
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

  // Filter states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeSizes, setActiveSizes] = useState<Set<string>>(new Set());
  const [activeAvailability, setActiveAvailability] = useState<string>('');
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());

  // Temp states for filter drawer editing
  const [tempSizes, setTempSizes] = useState<Set<string>>(new Set());
  const [tempAvailability, setTempAvailability] = useState<string>('');
  const [tempTypes, setTempTypes] = useState<Set<string>>(new Set());


  // Sync temp states when drawer opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setTempSizes(new Set(activeSizes));
      setTempAvailability(activeAvailability);
      setTempTypes(new Set(activeTypes));
    }
  }, [filterDrawerOpen, activeSizes, activeAvailability, activeTypes]);


  const categoryParam = searchParams.get('category') || '';
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

  // 1. Initial collection-level filtering
  const collectionFilteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (required === 'ALL') return true;
      const ok = productInCollections(p.collections, required);
      return ok;
    });
  }, [products, required]);

  // 2. Extract available filter values from collection-level products (keeps sizes, colors and types relevant to current collection context)
  const allAvailableSizes = useMemo(() => {
    const sizes = new Set<string>();
    collectionFilteredProducts.forEach(p => {
      p.variants?.forEach(v => {
        if (v.size) sizes.add(v.size.toUpperCase());
      });
    });
    if (sizes.size === 0) {
      return ["XS", "S", "M", "L", "XL", "2XL"];
    }
    const standardOrder = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
    return Array.from(sizes).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [collectionFilteredProducts]);

  const allAvailableTypes = useMemo(() => {
    const types = new Set<string>();
    collectionFilteredProducts.forEach(p => {
      const cat = (p.metadata?.category as string) || (p.metadata?.category_name as string);
      if (cat) {
        types.add(cat);
      } else {
        p.collections?.forEach(c => {
          if (c === 'tees') types.add('T-Shirts');
          else if (c === 'long-sleeve') types.add('Long Sleeve');
          else if (c === 'tanks') types.add('Tanks');
          else if (c === 'pants') types.add('Pants');
          else if (c === 'hoodies') types.add('Hoodies');
        });
      }
    });
    if (types.size === 0) {
      return ['T-shirts', 'Tanks', 'Pants', 'Hoodies'];
    }
    // Capitalize properly
    return Array.from(types).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }, [collectionFilteredProducts]);



  // 3. Apply active sidebar filters
  const sidebarFilteredProducts = useMemo(() => {
    return collectionFilteredProducts.filter((p) => {
      // Size Filter
      if (activeSizes.size > 0) {
        const pSizes = p.variants?.map(v => (v.size || '').toUpperCase()) || [];
        if (!pSizes.some(sz => activeSizes.has(sz))) return false;
      }

      // Type Filter
      if (activeTypes.size > 0) {
        const cat = ((p.metadata?.category as string) || (p.metadata?.category_name as string) || '').toUpperCase();
        let matches = activeTypes.has(cat);
        if (!matches) {
          p.collections?.forEach(c => {
            let colName = '';
            if (c === 'tees') colName = 'T-shirts';
            else if (c === 'long-sleeve') colName = 'Long Sleeve';
            else if (c === 'tanks') colName = 'Tanks';
            else if (c === 'pants') colName = 'Pants';
            else if (c === 'hoodies') colName = 'Hoodies';
            
            if (colName && activeTypes.has(colName.toUpperCase())) {
              matches = true;
            }
          });
        }
        if (!matches) return false;
      }

      // Availability Filter
      if (activeAvailability === 'Out of stock') {
        return false; // local mock products are in stock by default
      }

      return true;
    });
  }, [collectionFilteredProducts, activeSizes, activeTypes, activeAvailability]);

  // 4. Sort the filtered products
  const sortedProducts = useMemo(() => {
    const list = [...sidebarFilteredProducts];
    if (sortBy === 'Price Low→High') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'Price High→Low') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === 'Newest') {
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } else {
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
  }, [sidebarFilteredProducts, sortBy]);

  const heroImage = useMemo(() => {
    switch (activeChip) {
      case 'Short Sleeve T-Shirts':
        return '/assets/empty_centre.jpg';
      case 'Long Sleeve T-Shirts':
        return 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=2000&auto=format&fit=crop';
      case 'Tanks':
        return 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=2000&auto=format&fit=crop';
      case 'Sweatpants':
      case 'Bottomwear':
        return 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=2000&auto=format&fit=crop';
      case 'View all':
      case 'All Products':
      default:
        return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop';
    }
  }, [activeChip]);

  const heroDescription = useMemo(() => {
    switch (activeChip) {
      case 'Short Sleeve T-Shirts':
        return 'Heavyweight structural t-shirts. Engineered for daily wear.';
      case 'Long Sleeve T-Shirts':
        return 'Oversized waffle knit long-sleeves with boxy shoulders.';
      case 'Tanks':
        return 'Deconstructed tanks with raw panels and puff print.';
      case 'Sweatpants':
      case 'Bottomwear':
        return 'Ultra-heavyweight fleece sweatpants with utility pockets.';
      case 'View all':
      case 'All Products':
      default:
        return 'Explore the complete StreetPlayR collection.';
    }
  }, [activeChip]);

  const titleForChip =
    activeChip === 'View all' || activeChip === 'All Products'
      ? 'All Products'
      : activeChip;

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-clip">
      <Navbar />


      <CollectionHero
        title={titleForChip}
        description={heroDescription}
        imageSrc={heroImage}
        label="Collection / SS26"
      />

      <main id="collections-products" className="relative z-[1] pb-10 md:pb-14 w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
        <div className="listing listing--collections">
          <div className="collections-toolbar">
            <div className="collections-toolbar-scroll-wrap hidden md:flex">
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

              {DESKTOP_CHIPS.map((c) => {
                const isActive = activeDesktopChip === c && (!categoryParam || categoryParam === 'all' ? false : true);
                return (
                  <button
                    key={c}
                    type="button"
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

            <div className="collections-toolbar-actions">

              {/* Advance Filters Button */}
              <button
                type="button"
                className={`advance-filters-btn ${(activeSizes.size > 0 || activeTypes.size > 0 || activeAvailability) ? 'has-active' : ''}`}
                onClick={() => setFilterDrawerOpen(true)}
              >
                Advance Filters
              </button>

              {/* Sort Dropdown */}
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
                  <span className="collections-sort__text">Sort <span className="collections-sort__arrow-inline">▾</span> {sortBy}</span>
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
                        <span className="collections-sort__option-left">
                          {getSortIcon(s)}
                          <span>{s}</span>
                        </span>
                        {sortBy === s && <CheckIcon />}
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

      {/* Filter Drawer Scrim */}
      <div
        className={`scrim ${filterDrawerOpen ? 'open' : ''}`}
        onClick={() => setFilterDrawerOpen(false)}
        style={{ zIndex: 95 }}
      />

      {/* Filter Drawer Side Panel */}
      <aside
        className={`drawer drawer--filter ${filterDrawerOpen ? 'open' : ''}`}
        aria-hidden={!filterDrawerOpen}
        inert={!filterDrawerOpen ? true : undefined}
        style={{
          left: 10,
          right: 'auto',
          width: 'min(440px, calc(100% - 20px))',
          borderRadius: 18,
          zIndex: 100,
        }}
      >
        <div className="drawer__head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em' }}>Filter</h3>
            <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-sp-mono)', fontWeight: 600 }}>
              {sidebarFilteredProducts.length} {sidebarFilteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
          <button
            onClick={() => setFilterDrawerOpen(false)}
            className="drawer__close"
            aria-label="Close filters"
            style={{ fontSize: '20px' }}
          >
            &times;
          </button>
        </div>

        <div className="drawer__body drawer__body--filter">
          {/* Size Section */}
          <div className="filter-section">
            <h4>Size</h4>
            <div className="filter-chips">
              {allAvailableSizes.map((sz) => {
                const active = tempSizes.has(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => {
                      const next = new Set(tempSizes);
                      if (next.has(sz)) next.delete(sz);
                      else next.add(sz);
                      setTempSizes(next);
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Section */}
          <div className="filter-section">
            <h4>Availability</h4>
            <div className="filter-chips">
              {['In stock', 'Out of stock'].map((av) => {
                const active = tempAvailability === av;
                return (
                  <button
                    key={av}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => {
                      setTempAvailability(tempAvailability === av ? '' : av);
                    }}
                  >
                    {av}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type Section */}
          <div className="filter-section">
            <h4>Type</h4>
            <div className="filter-chips">
              {allAvailableTypes.map((t) => {
                const active = tempTypes.has(t.toUpperCase());
                return (
                  <button
                    key={t}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => {
                      const next = new Set(tempTypes);
                      const key = t.toUpperCase();
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      setTempTypes(next);
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="drawer__foot" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px 20px' }}>
          <button
            type="button"
            className="filter-btn-secondary"
            onClick={() => {
              setTempSizes(new Set());
              setTempAvailability('');
              setTempTypes(new Set());
            }}
          >
            Remove All
          </button>
          <button
            type="button"
            className="filter-btn-primary"
            onClick={() => {
              setActiveSizes(new Set(tempSizes));
              setActiveAvailability(tempAvailability);
              setActiveTypes(new Set(tempTypes));
              setFilterDrawerOpen(false);
            }}
          >
            Apply
          </button>
        </div>
      </aside>

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
