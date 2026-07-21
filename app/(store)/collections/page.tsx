'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import { useCart } from '@/components/CartContext';

const filterChips = ["View all", "Tees", "Tanks", "Pants", "Hoodies"];
const disabledChips = ["Hoodies"];

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low"] as const;
type SortOption = typeof sortOptions[number];

const chipToCategory = (chip: string) => {
  if (chip === "View all") return "ALL";
  return chip.toUpperCase();
};

const categoryToChip = (category: string) => {
  if (!category || category === "ALL") return "View all";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

function CollectionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cart = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const initialCategory = searchParams.get('category')?.toUpperCase() || 'ALL';
  const initialChip = filterChips.includes(categoryToChip(initialCategory)) 
    ? categoryToChip(initialCategory) 
    : 'View all';

  const [activeChip, setActiveChip] = useState(initialChip);
  const [sortBy, setSortBy] = useState<SortOption>("Featured");

  // Sync state if URL search param changes
  useEffect(() => {
    const cat = searchParams.get('category')?.toUpperCase() || 'ALL';
    setActiveChip(categoryToChip(cat));
  }, [searchParams]);

  // Load products from DB or fallback
  useEffect(() => {
    async function loadProducts() {
      try {
        const { getLocalActiveProducts } = await import('@/lib/products/data');
        const local = getLocalActiveProducts();
        
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url || url.includes('mockproject')) {
          setProducts(local);
          setLoading(false);
          return;
        }

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, featured_image_url, metadata, status, product_variants(id, price)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setProducts(local);
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

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    const category = chipToCategory(chip);
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'ALL') {
      params.delete('category');
    } else {
      params.set('category', category.toLowerCase());
    }
    const qs = params.toString();
    router.replace(qs ? `/collections?${qs}` : '/collections', { scroll: false });
  };

  const filteredProducts = activeChip === 'View all'
    ? products
    : products.filter(
        (p) => p.category?.toUpperCase() === chipToCategory(activeChip)
      );

  const sortedProducts = [...filteredProducts];
  if (sortBy === "Price: Low to High") {
    sortedProducts.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sortBy === "Price: High to Low") {
    sortedProducts.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }
  // "Featured" keeps the catalog's default/curated order — there's no real
  // popularity/sales signal in the product data to sort by yet.

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <Navbar />

      <section className="relative z-[1] w-full h-[460px] overflow-hidden border-b border-white/[0.10] mt-20">
        {/* Desktop motion banner */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 hidden md:block"
          src="/assets/COLLECTION_MOTION_BANNER.mp4"
        />
        {/* Mobile motion banner */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 md:hidden"
          src="/assets/FOR_MOBILE_ST_COLLECTION.mp4"
        />
      </section>

      <main className="relative z-[1] pb-20 w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12 pt-14">
        <div className="listing">
          <div className="listing__head">
            <h1 className="listing__title">The Archive</h1>
            <button 
              className="listing__adv" 
              onClick={() => cart.showToast('Advanced filters coming soon')}
            >
              Advanced Filters
            </button>
          </div>

          <div className="chips">
            {filterChips.map((c) => {
              const isDisabled = disabledChips.includes(c);
              return (
                <button
                  key={c}
                  className={`chip ${activeChip === c ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleChipClick(c)}
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
