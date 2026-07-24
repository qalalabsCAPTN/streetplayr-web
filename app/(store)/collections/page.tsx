'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import { useCart } from '@/components/CartContext';

/** Desktop collection chips (req: Latest Drop + product lines). */
const DESKTOP_CHIPS = [
  "Latest Drop",
  "Short Sleeve T-Shirts",
  "Long Sleeve T-Shirts",
  "Tanks",
  "Sweatpants",
] as const;

/** Mobile chips — preserve approved Topwear/Bottomwear naming. */
const MOBILE_CHIPS = ["View all", "Topwear", "Bottomwear", "Hoodies"] as const;

type DesktopChip = typeof DESKTOP_CHIPS[number];
type MobileChip = typeof MOBILE_CHIPS[number];
type FilterChip = DesktopChip | MobileChip;

const DISABLED_MOBILE: MobileChip[] = ["Hoodies"];

const sortOptions = ["Popular", "Price: Low to High", "Price: High to Low"] as const;
type SortOption = typeof sortOptions[number];

const TEES = new Set(["TEES", "TEE"]);
const TANKS = new Set(["TANKS", "TANK"]);
const LONG_SLEEVE = new Set(["LONG-SLEEVE", "LONG_SLEEVE", "LONGSLEEVE"]);
const PANTS = new Set(["PANTS", "PANT", "SWEATPANTS", "BOTTOMWEAR", "BOTTOMS"]);
const TOPWEAR = new Set([...TEES, ...TANKS, ...LONG_SLEEVE, "TOPWEAR", "TOPS"]);

const chipToParam = (chip: FilterChip): string | null => {
  switch (chip) {
    case "View all":
    case "Latest Drop":
      return null;
    case "Short Sleeve T-Shirts":
    case "Topwear":
      return chip === "Topwear" ? "topwear" : "tees";
    case "Long Sleeve T-Shirts":
      return "long-sleeve";
    case "Tanks":
      return "tanks";
    case "Sweatpants":
    case "Bottomwear":
      return chip === "Bottomwear" ? "bottomwear" : "pants";
    case "Hoodies":
      return "hoodies";
    default:
      return null;
  }
};

const paramToChip = (category: string, mobile: boolean): FilterChip => {
  if (!category || category === "ALL" || category === "LATEST") {
    return mobile ? "View all" : "Latest Drop";
  }
  const upper = category.toUpperCase();
  if (mobile) {
    if (upper === "HOODIES" || upper === "HOODIE") return "Hoodies";
    if (upper === "BOTTOMWEAR" || PANTS.has(upper)) return "Bottomwear";
    if (upper === "TOPWEAR" || TOPWEAR.has(upper) || TEES.has(upper) || TANKS.has(upper) || LONG_SLEEVE.has(upper)) {
      return "Topwear";
    }
    return "View all";
  }
  if (TEES.has(upper) || upper === "TEES") return "Short Sleeve T-Shirts";
  if (LONG_SLEEVE.has(upper) || upper === "LONG-SLEEVE") return "Long Sleeve T-Shirts";
  if (TANKS.has(upper)) return "Tanks";
  if (PANTS.has(upper) || upper === "PANTS") return "Sweatpants";
  if (upper === "TOPWEAR") return "Short Sleeve T-Shirts";
  if (upper === "BOTTOMWEAR") return "Sweatpants";
  if (upper === "OUTERWEAR" || upper === "HOODIES") return "Latest Drop";
  return "Latest Drop";
};

function matchesChip(productCategory: string | undefined, chip: FilterChip): boolean {
  if (chip === "View all" || chip === "Latest Drop") return true;
  const cat = (productCategory || "").toUpperCase();
  if (chip === "Short Sleeve T-Shirts") return TEES.has(cat);
  if (chip === "Long Sleeve T-Shirts") return LONG_SLEEVE.has(cat);
  if (chip === "Tanks") return TANKS.has(cat);
  if (chip === "Sweatpants") return PANTS.has(cat);
  if (chip === "Topwear") return TOPWEAR.has(cat);
  if (chip === "Bottomwear") return PANTS.has(cat);
  if (chip === "Hoodies") return cat === "HOODIES" || cat === "HOODIE";
  return false;
}

function CollectionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cart = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const chips: readonly FilterChip[] = isMobile ? MOBILE_CHIPS : DESKTOP_CHIPS;
  const initialChip = paramToChip(searchParams.get('category') || 'ALL', isMobile);
  const [activeChip, setActiveChip] = useState<FilterChip>(initialChip);
  const [sortBy, setSortBy] = useState<SortOption>("Popular");

  useEffect(() => {
    setActiveChip(paramToChip(searchParams.get('category') || 'ALL', isMobile));
  }, [searchParams, isMobile]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { getLocalActiveProducts } = await import('@/lib/products/data');
        const local = getLocalActiveProducts();
        
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url || url.includes('mockproject')) {
          setProducts(local.map((p: any, i: number) => ({ ...p, createdAt: Date.now() - i * 1000 })));
          setLoading(false);
          return;
        }

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, featured_image_url, metadata, status, created_at, product_variants(id, price)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setProducts(local.map((p: any, i: number) => ({ ...p, createdAt: Date.now() - i * 1000 })));
          setLoading(false);
          return;
        }

        const mapped = data.map((p) => {
          const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          return {
            id: p.id,
            name: p.title,
            price: minPrice,
            slug: p.slug,
            image: p.featured_image_url,
            category: p.metadata?.category || 'TEES',
            metadata: p.metadata || {},
            createdAt: p.created_at ? Date.parse(p.created_at) : 0,
          };
        });
        setProducts(mapped);
      } catch (err) {
        console.error('Failed to load products for collections:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleChipClick = (chip: FilterChip) => {
    if (isMobile && DISABLED_MOBILE.includes(chip as MobileChip)) return;
    setActiveChip(chip);
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

  const filteredProducts = products.filter((p) => matchesChip(p.category, activeChip));

  const sortedProducts = [...filteredProducts];
  if (sortBy === "Price: Low to High") {
    sortedProducts.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sortBy === "Price: High to Low") {
    sortedProducts.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else {
    sortedProducts.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <Navbar />

      <section className="relative z-[1] w-full h-[460px] md:h-[560px] overflow-hidden mt-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 hidden md:block"
          src="/assets/COLLECTION_MOTION_BANNER.mp4"
        />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 md:hidden"
          src="/assets/FOR_MOBILE_ST_COLLECTION.mp4"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 md:h-56 bg-gradient-to-t from-[var(--page-bg)] to-transparent pointer-events-none" />
      </section>

      <main className="relative z-[1] pb-20 w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12">
        <div className="listing">
          <div className="listing__head">
            <div>
              <span className="listing__eyebrow">Collection / SS26</span>
              <h1 className="listing__title">The Archive</h1>
            </div>
            <button
              className="listing__adv"
              onClick={() => cart.showToast('Advanced filters coming soon')}
            >
              Advanced Filters
            </button>
          </div>

          <div className="chips">
            {chips.map((c) => {
              const isDisabled = isMobile && DISABLED_MOBILE.includes(c as MobileChip);
              return (
                <button
                  key={c}
                  className={`chip ${activeChip === c ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleChipClick(c)}
                  disabled={isDisabled}
                >
                  {isDisabled ? `${c} (Soon)` : c}
                </button>
              );
            })}
          </div>

          <div className="chips chips--sort">
            <span className="chips__label">Sort:</span>
            {sortOptions.map((s) => (
              <button
                key={s}
                className={`chip ${sortBy === s ? 'active' : ''}`}
                onClick={() => setSortBy(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="py-24 text-center">
              <p style={{ color: '#757575', fontSize: 13 }}>No products in this filter yet.</p>
            </div>
          ) : (
            <div className="pgrid">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} gallery={true} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    }>
      <CollectionsInner />
    </Suspense>
  );
}
