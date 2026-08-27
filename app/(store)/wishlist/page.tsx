'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/utils/format';
import { useCart } from '@/components/CartContext';
import { useEffect, useState } from 'react';
import type { CatalogProduct } from '@/lib/products/queries';

export default function WishlistPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const setLoginOpen = useWishlistStore((s) => s.setLoginOpen);
  const hydrated = useWishlistStore((s) => s.hydrated);
  const cart = useCart();
  const [catalog, setCatalog] = useState<CatalogProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadClientCatalog } = await import('@/lib/products/client-catalog');
        const products = await loadClientCatalog();
        if (!cancelled) setCatalog(products);
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems =
    catalog === null
      ? []
      : items.filter((item) =>
          catalog.some((p) => p.id === item.id || p.slug === item.slug)
        );

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6 pt-[calc(var(--header-h)+40px)] pb-24">
        <span className="listing__eyebrow block mb-2">Account</span>
        <h1 className="listing__title mb-8">Wishlist</h1>

        {!hydrated || catalog === null ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="py-16 text-center">
            <p className="listing__empty mb-6">Sign in to save and sync your wishlist.</p>
            <button
              type="button"
              className="storefront-cta storefront-cta--inline"
              onClick={() => setLoginOpen(true)}
            >
              Sign In
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="listing__empty mb-6">Your wishlist is empty.</p>
            <Link href="/collections" className="storefront-cta storefront-cta--inline">
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="pgrid">
            {visibleItems.map((item) => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={`/product/${item.slug}`} className="card__media" style={{ position: 'relative', aspectRatio: '4/5' }}>
                  <Image src={item.image} alt={item.name} fill className="active object-cover" sizes="(max-width:768px) 50vw, 25vw" />
                </Link>
                <div className="card__info">
                  <div>
                    <Link href={`/product/${item.slug}`} className="card__title">
                      {item.name}
                    </Link>
                    <div className="card__price">
                      <span>{formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="card__add"
                    aria-label="Remove from wishlist"
                    onClick={() => {
                      remove(item.id);
                      cart.showToast('Removed from wishlist');
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
