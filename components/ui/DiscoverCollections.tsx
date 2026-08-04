'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { discoverCollections } from '@/lib/bluorng-data';

/** 
 * Discover collections swipe carousel (mobile / tablet).
 * Render exactly two cards: Topwear and Bottomwear.
 * Touch swipe, GPU accelerated translate3d, ease-out, no autoplay.
 */
export default function DiscoverCollections() {
  // Desktop has display: none; mobile/tablet shows this swiper.
  // We keep only the first two collections (Topwear, Bottomwear) for mobile swiper.
  const collections = discoverCollections.slice(0, 2);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [slideWidth, setSlideWidth] = useState(300);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      const w = Math.min(containerRef.current!.getBoundingClientRect().width * 0.82, 360);
      setSlideWidth(w);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const gap = 10;
  const maxIndex = collections.length - 1;

  // Calculate target translation for a given slide index
  const getTargetTranslate = (index: number) => {
    return -index * (slideWidth + gap);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
    
    const diff = e.touches[0].clientX - startX;
    const baseTranslate = getTargetTranslate(currentIndex);
    let targetTranslate = baseTranslate + diff;

    // Apply resistance at boundaries
    if (targetTranslate > 0) {
      targetTranslate = diff / 3;
    } else if (targetTranslate < getTargetTranslate(maxIndex)) {
      const overflow = targetTranslate - getTargetTranslate(maxIndex);
      targetTranslate = getTargetTranslate(maxIndex) + overflow / 3;
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0, 0)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentX - startX;
    let nextIndex = currentIndex;

    if (diff < -50 && currentIndex < maxIndex) {
      nextIndex = currentIndex + 1;
    } else if (diff > 50 && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    setCurrentIndex(nextIndex);
    
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 250ms ease-out';
      trackRef.current.style.transform = `translate3d(${getTargetTranslate(nextIndex)}px, 0, 0)`;
    }
  };

  // Sync track transform on resize or index changes
  useEffect(() => {
    if (trackRef.current && !isDragging) {
      trackRef.current.style.transition = 'transform 250ms ease-out';
      trackRef.current.style.transform = `translate3d(${getTargetTranslate(currentIndex)}px, 0, 0)`;
    }
  }, [currentIndex, slideWidth, isDragging]);

  return (
    <section className="discover" ref={containerRef}>
      <div className="discover__label">Discover collection</div>
      <div
        className="discover__swiper-outer"
        style={{
          width: '100%',
          overflow: 'hidden',
          padding: '0 16px 4px',
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="discover__swiper-track"
          style={{
            display: 'flex',
            gap: `${gap}px`,
            width: '100%',
            willChange: 'transform',
            transform: `translate3d(${getTargetTranslate(currentIndex)}px, 0, 0)`
          }}
        >
          {collections.map((c, i) => (
            <div
              key={c.handle}
              className="discover__panel"
              style={{
                flex: `0 0 ${slideWidth}px`,
                width: `${slideWidth}px`
              }}
            >
              <Image
                src={c.image}
                alt={c.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 85vw, 50vw"
                loading="lazy"
              />
              <div className="discover__overlay">
                <h2 className="discover__title">{c.title}</h2>
                <Link
                  href={`/collections?category=${c.handle}`}
                  className="storefront-cta storefront-cta--inline discover__cta"
                >
                  Shop now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
