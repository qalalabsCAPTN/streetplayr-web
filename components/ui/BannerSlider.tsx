'use client';

import { useCallback, useEffect, useState } from 'react';
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

  if (!slides.length) return null;

  const active = slides[idx];

  return (
    <section
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
        href={active.href}
        className="bslider__link"
        aria-label={`${active.title} — ${active.cta}`}
      />
    </section>
  );
}
