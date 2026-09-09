'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { banners } from '@/lib/bluorng-data';

/**
 * Mid-home collection banner slider.
 * Assets: SS25 lookbook + lifestyle product frames (not PDP waist crops).
 * Load: first slide priority; others lazy. Crop via per-slide object-position.
 */
export default function BannerSlider() {
  const slides = banners;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    axis: false as false | 'x' | 'y',
    moved: false,
  });

  const step = useCallback(
    (dir: number) => {
      setIdx((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => step(1), 5500);
    return () => clearInterval(t);
  }, [paused, slides.length, step]);

  useEffect(() => {
    // Overlay <Link> is the real hit target (z-index 4). Listeners must sit
    // on that node — ancestor touchmove cannot reliably preventDefault.
    const el = linkRef.current ?? sectionRef.current;
    if (!el || slides.length < 2) return;

    const onStart = (e: TouchEvent) => {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        axis: false,
        moved: false,
      };
      setPaused(true);
    };

    const onMove = (e: TouchEvent) => {
      const d = dragRef.current;
      const dx = e.touches[0].clientX - d.startX;
      const dy = e.touches[0].clientY - d.startY;
      if (!d.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (d.axis !== 'x') return;
      if (e.cancelable) e.preventDefault();
      if (Math.abs(dx) > 8) d.moved = true;
    };

    const onEnd = (e: TouchEvent) => {
      const d = dragRef.current;
      const dx = e.changedTouches[0].clientX - d.startX;
      const wasX = d.axis === 'x';
      d.axis = false;
      setPaused(false);
      if (!wasX || Math.abs(dx) < 50) return;
      step(dx < 0 ? 1 : -1);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [slides.length, step]);

  if (!slides.length) return null;

  const active = slides[idx];

  return (
    <section
      ref={sectionRef}
      className="bslider"
      aria-label="Collection banner"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const isActive = i === idx;
        // Eager-load active + next so autoplay does not flash empty frames
        const warm = isActive || i === (idx + 1) % slides.length || i === 0;
        return (
          <div
            key={s.title}
            className={`bslide ${isActive ? 'active' : ''}`}
            aria-hidden={!isActive}
          >
            <Image
              src={s.image}
              alt={s.title}
              fill
              sizes="(max-width: 900px) calc(100% - 12px), min(95vw, 2400px)"
              className="bslide__img object-cover"
              style={{ objectPosition: s.objectPosition ?? 'center 22%' }}
              priority={i === 0}
              loading={warm ? 'eager' : 'lazy'}
              quality={80}
            />
            <div className="bslide__overlay">
              <h2 className="bslide__title">{s.title}</h2>
              <span className="storefront-cta storefront-cta--inline bslide__cta">
                {s.cta || 'Shop now'}
              </span>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="bslider__dots" role="tablist" aria-label="Banner slides">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={`bslider__dot ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Banner ${i + 1}: ${s.title}`}
              aria-selected={i === idx}
            />
          ))}
        </div>
      )}

      {/* Invisible hit target — whole banner opens active collection */}
      <Link
        ref={linkRef}
        href={active.href}
        className="bslider__link"
        aria-label={`${active.title} — ${active.cta}`}
        onClick={(e) => {
          if (dragRef.current.moved) {
            e.preventDefault();
            dragRef.current.moved = false;
          }
        }}
      />
    </section>
  );
}
