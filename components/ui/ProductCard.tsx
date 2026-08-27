'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { useWishlistStore } from '@/store/wishlistStore';
import { normalizeProductImageUrl, resolveProductImages } from '@/lib/products/image-map';
import QuickAddSheet, { type QuickAddVariant } from '@/components/ui/QuickAddSheet';
import type { PdpVariant } from '@/lib/products/pdp-variant-selection';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    image: string;
    image2?: string;
    images?: string[];
    category?: string;
    soldOut?: boolean;
    compareAt?: number;
    /** product_variants — used to resolve UUID line id on quick-add */
    variants?: QuickAddVariant[];
    metadata?: {
      gallery_images?: string[];
    };
  };
  gallery?: boolean;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 18 22" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
      <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h11A1.5 1.5 0 0 1 16 2.5V20l-7-4.5L2 20V2.5Z" />
    </svg>
  );
}

export default function ProductCard({ product, gallery = true }: ProductCardProps) {
  const cart = useCart();
  const router = useRouter();
  const isSaved = useWishlistStore((s) => s.isSaved(product.id));
  const requestToggle = useWishlistStore((s) => s.requestToggle);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; bottom: number; left: number; right: number } | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const galleryMeta = Array.isArray(product.images)
    ? product.images
    : Array.isArray(product.metadata?.gallery_images)
      ? product.metadata.gallery_images
      : null;
  const imgs = useMemo(() => {
    const raw = (
      galleryMeta && galleryMeta.length > 0
        ? galleryMeta
        : [product.image, product.image2]
    ).filter((src): src is string => typeof src === 'string' && src.length > 0);

    const normalized = Array.from(
      new Set(raw.map((src) => normalizeProductImageUrl(src, product.slug)).filter(Boolean))
    );

    if (normalized.length > 0) return normalized;

    const pack = resolveProductImages(product.slug);
    return pack ? pack.gallery : [];
  }, [galleryMeta, product.image, product.image2, product.slug, product.images]);

  const [idx, setIdx] = useState(0);
  const [desktopGalleryNav, setDesktopGalleryNav] = useState(false);
  const activeSrc = imgs[idx] ?? imgs[0] ?? '';

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 769px)');
    const apply = () => setDesktopGalleryNav(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const onSale = product.compareAt && product.compareAt > product.price;

  const step = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + dir + imgs.length) % imgs.length);
  };

  const openQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.soldOut) {
      cart.showToast('This product is sold out');
      return;
    }
    if (!product.variants?.length) {
      cart.showToast('Open product to select size');
      return;
    }
    const el = addBtnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setAnchorRect({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    } else {
      setAnchorRect(null);
    }
    setSheetOpen(true);
  };

  const addVariant = (variant: PdpVariant, openDrawer: boolean) => {
    cart.addItem(
      {
        handle: product.slug,
        productId: product.id,
        title: product.name,
        price: product.price,
        images: imgs,
        variantId: variant.id,
      },
      variant.size,
      { openDrawer }
    );
    setSheetOpen(false);
    if (openDrawer) cart.showToast('Added to bag');
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = requestToggle({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      addedAt: Date.now(),
    });
    if (result === 'login_required') {
      cart.showToast('Sign in to save items');
      return;
    }
    cart.showToast(result === 'added' ? 'Saved to wishlist' : 'Removed from wishlist');
  };

  return (
    <>
    <Link href={`/product/${product.slug}`} className="card">
      <div className="card__media">
        {activeSrc ? (
          <Image
            key={activeSrc}
            src={activeSrc}
            alt={product.name}
            fill
            loading="lazy"
            className="active object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => {
              if (idx < imgs.length - 1) setIdx((i) => i + 1);
            }}
          />
        ) : null}

        <button className="card__wish" onClick={toggleSave} aria-label="Save to wishlist" aria-pressed={isSaved}>
          <BookmarkIcon filled={isSaved} />
        </button>

        {product.soldOut && <span className="card__badge">Sold out</span>}
        {onSale && !product.soldOut && <span className="card__badge">Sale</span>}

        {gallery && imgs.length > 1 && desktopGalleryNav && (
          <>
            <button className="card__nav card__nav--prev" onClick={(e) => step(e, -1)} aria-label="Previous image">
              ←
            </button>
            <button className="card__nav card__nav--next" onClick={(e) => step(e, 1)} aria-label="Next image">
              →
            </button>
          </>
        )}
        {gallery && imgs.length > 1 && (
          <div className="card__dots">
            {imgs.map((_, i) => (
              <span key={i} className={`card__dot ${i === idx ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="card__info">
        <div>
          <h3 className="card__title">{product.name}</h3>
          <div className="card__price">
            {onSale && <s>{formatPrice(product.compareAt || 0)}</s>}
            <span>{formatPrice(product.price)}</span>
          </div>
        </div>
        <button
          ref={addBtnRef}
          type="button"
          className="card__add"
          onClick={openQuickAdd}
          aria-label="Quick add"
        >
          +
        </button>
      </div>
    </Link>
    <QuickAddSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title={product.name}
      price={product.price}
      variants={product.variants ?? []}
      anchorRect={anchorRect}
      onAddToBag={(variant) => addVariant(variant, true)}
      onBuyNow={(variant) => {
        addVariant(variant, false);
        router.push('/checkout');
      }}
    />
    </>
  );
}
