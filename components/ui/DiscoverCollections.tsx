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
  const [slideWidth, setSlideWidth] = useState(300);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const widthRef = useRef(300);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    axis: false as false | 'x' | 'y',
  });

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    widthRef.current = slideWidth;
  }, [slideWidth]);

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

  const getTargetTranslate = (index: number, width = widthRef.current) => {
    return -index * (width + gap);
  };

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const onStart = (e: TouchEvent) => {
      dragRef.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        currentX: e.touches[0].clientX,
        axis: false,
      };
      if (trackRef.current) trackRef.current.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.touches[0].clientX - d.startX;
      const dy = e.touches[0].clientY - d.startY;
      if (!d.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (d.axis === 'y') return;
      if (e.cancelable) e.preventDefault();
      d.currentX = e.touches[0].clientX;

      const idx = indexRef.current;
      const baseTranslate = getTargetTranslate(idx);
      let targetTranslate = baseTranslate + dx;
      if (targetTranslate > 0) {
        targetTranslate = dx / 3;
      } else if (targetTranslate < getTargetTranslate(maxIndex)) {
        const overflow = targetTranslate - getTargetTranslate(maxIndex);
        targetTranslate = getTargetTranslate(maxIndex) + overflow / 3;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0, 0)`;
      }
    };

    const onEnd = () => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      if (d.axis !== 'x') return;

      const diff = d.currentX - d.startX;
      let nextIndex = indexRef.current;
      if (diff < -50 && nextIndex < maxIndex) nextIndex += 1;
      else if (diff > 50 && nextIndex > 0) nextIndex -= 1;
      setCurrentIndex(nextIndex);
      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 250ms ease-out';
        trackRef.current.style.transform = `translate3d(${getTargetTranslate(nextIndex)}px, 0, 0)`;
      }
    };

    outer.addEventListener('touchstart', onStart, { passive: true });
    outer.addEventListener('touchmove', onMove, { passive: false });
    outer.addEventListener('touchend', onEnd, { passive: true });
    outer.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      outer.removeEventListener('touchstart', onStart);
      outer.removeEventListener('touchmove', onMove);
      outer.removeEventListener('touchend', onEnd);
      outer.removeEventListener('touchcancel', onEnd);
    };
  }, [maxIndex]);

  useEffect(() => {
    if (trackRef.current && !dragRef.current.active) {
      trackRef.current.style.transition = 'transform 250ms ease-out';
      trackRef.current.style.transform = `translate3d(${getTargetTranslate(currentIndex)}px, 0, 0)`;
    }
  }, [currentIndex, slideWidth]);

  return (
    <section className="discover" ref={containerRef}>
      <div className="discover__label">Discover collection</div>
      <div
        ref={outerRef}
        className="discover__swiper-outer"
        style={{
          width: '100%',
          overflow: 'hidden',
          padding: '0 16px 4px',
        }}
      >
        <div
          ref={trackRef}
          className="discover__swiper-track"
          style={{
            display: 'flex',
            gap: `${gap}px`,
            width: '100%',
            willChange: 'transform',
            transform: `translate3d(${getTargetTranslate(currentIndex)}px, 0, 0)`,
          }}
        >
          {collections.map((c) => (
            <div
              key={c.handle}
              className="discover__panel"
              style={{
                flex: `0 0 ${slideWidth}px`,
                width: `${slideWidth}px`,
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
