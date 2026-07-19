'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';

interface CarouselProduct {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  soldOut?: boolean;
  image: string;
  image2?: string;
}

export default function Product3DCarousel({ products }: { products: CarouselProduct[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartCoords = useRef({ x: 0, y: 0 });
  const isSwiping = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartCoords.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = Math.abs(touchX - touchStartCoords.current.x);
      const deltaY = Math.abs(touchY - touchStartCoords.current.y);
      if (deltaX > deltaY && deltaX > 10 && e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      isSwiping.current = false;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchStartCoords.current.x - touchEndX;
      const deltaY = touchStartCoords.current.y - touchEndY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) setActiveIdx((prev) => (prev + 1) % products.length);
        else setActiveIdx((prev) => (prev - 1 + products.length) % products.length);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [products.length]);

  if (!products || products.length === 0) return null;

  const handleCardClick = (e: React.MouseEvent, index: number, diff: number) => {
    if (diff !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx(index);
    }
  };

  const getCardStyle = (index: number): React.CSSProperties => {
    let diff = index - activeIdx;
    const half = Math.floor(products.length / 2);
    if (diff > half) diff -= products.length;
    if (diff < -half) diff += products.length;
    const absDiff = Math.abs(diff);

    if (absDiff > 2) {
      return {
        opacity: 0,
        transform: `translateX(${diff > 0 ? 100 : -100}px) scale(0.5) translateZ(-200px) rotateY(${diff > 0 ? -45 : 45}deg)`,
        zIndex: 0,
        pointerEvents: 'none',
      };
    }

    const translateX = diff * 75;
    const scale = 1 - absDiff * 0.14;
    const rotateY = -diff * 18;
    const translateZ = -absDiff * 80;
    const opacity = 1 - absDiff * 0.35;
    const zIndex = 10 - absDiff;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      pointerEvents: diff === 0 ? 'auto' : 'none',
    };
  };

  return (
    <div className="carousel3d">
      <div ref={containerRef} className="carousel3d__container">
        {products.map((p, index) => {
          let diff = index - activeIdx;
          const half = Math.floor(products.length / 2);
          if (diff > half) diff -= products.length;
          if (diff < -half) diff += products.length;

          const onSale = p.compareAt && p.compareAt > p.price;
          const imageSrc = p.image || p.image2 || '';

          return (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className={`carousel3d__card ${diff === 0 ? 'carousel3d__card--active' : ''}`}
              style={getCardStyle(index)}
              onClick={(e) => handleCardClick(e, index, diff)}
            >
              <div className="carousel3d__media">
                {imageSrc && <img src={imageSrc} alt={p.name} className="carousel3d__image" />}
                {onSale && !p.soldOut && <div className="carousel3d__badge">Sale</div>}
                {p.soldOut && <div className="carousel3d__badge carousel3d__badge--soldout">Sold out</div>}
                <div className="carousel3d__overlay">
                  <h3 className="carousel3d__title">{p.name}</h3>
                  <p className="carousel3d__price">
                    {onSale && <span className="carousel3d__price--old">{formatPrice(p.compareAt || 0)}</span>}
                    <span className="carousel3d__price--current">{formatPrice(p.price)}</span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="carousel3d__dots">
        {products.map((_, i) => (
          <button
            key={i}
            className={`carousel3d__dot ${i === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
