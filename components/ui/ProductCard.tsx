'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { useWishlistStore } from '@/store/wishlistStore';

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
    variants?: { id: string; size: string }[];
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
  const [idx, setIdx] = useState(0);
  const cart = useCart();
  const isSaved = useWishlistStore((s) => s.isSaved(product.id));
  const requestToggle = useWishlistStore((s) => s.requestToggle);

  const imgs = product.images || product.metadata?.gallery_images || [product.image, product.image2].filter(Boolean);
  const onSale = product.compareAt && product.compareAt > product.price;

  const step = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + dir + imgs.length) % imgs.length);
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.soldOut) {
      cart.showToast('This product is sold out');
      return;
    }
    const size = 'M';
    const matching =
      product.variants?.find((v) => v.size === size) ?? product.variants?.[0];
    if (!matching?.id) {
      cart.showToast('Open product to select size');
      return;
    }
    cart.addItem(
      {
        handle: product.slug,
        productId: product.id,
        title: product.name,
        price: product.price,
        images: imgs,
        variantId: matching.id,
      },
      matching.size || size
    );
    cart.showToast('Added to bag');
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
    <Link href={`/product/${product.slug}`} className="card">
      <div className="card__media">
        {imgs.map((src, i) => (
          <Image
            key={src}
            src={src ?? ''}
            alt={product.name}
            fill
            loading="lazy"
            className={i === idx ? 'active' : ''}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ))}

        <button className="card__wish" onClick={toggleSave} aria-label="Save to wishlist" aria-pressed={isSaved}>
          <BookmarkIcon filled={isSaved} />
        </button>

        {product.soldOut && <span className="card__badge">Sold out</span>}
        {onSale && !product.soldOut && <span className="card__badge">Sale</span>}

        {gallery && imgs.length > 1 && (
          <>
            <button className="card__nav card__nav--prev" onClick={(e) => step(e, -1)} aria-label="Previous image">
              ←
            </button>
            <button className="card__nav card__nav--next" onClick={(e) => step(e, 1)} aria-label="Next image">
              →
            </button>
            <div className="card__dots">
              {imgs.map((_, i) => (
                <span key={i} className={`card__dot ${i === idx ? 'active' : ''}`} />
              ))}
            </div>
          </>
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
        <button className="card__add" onClick={quickAdd} aria-label="Quick add">
          +
        </button>
      </div>
    </Link>
  );
}
