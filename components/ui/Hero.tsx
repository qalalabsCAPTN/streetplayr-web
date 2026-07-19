'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    src: '/banners/empty centre.jpg',
    mobileSrc: '/banners/mobile-banner.jpg',
    alt: 'Streetplayr',
    href: '/collections',
  },
];

export default function Hero() {
  const [slides, setSlides] = useState(SLIDES);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dropSlide = useCallback((src: string) => {
    setSlides((prev) => {
      const next = prev.filter((s) => s.src !== src);
      return next.length ? next : prev.slice(0, 1);
    });
    setIdx(0);
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const step = (dir: number) => setIdx((i) => (i + dir + slides.length) % slides.length);
  const current = slides[Math.min(idx, slides.length - 1)];

  if (!mounted) {
    return <section className="hero hero--banner" style={{ minHeight: '320px', background: '#dfddd8' }} />;
  }

  return (
    <section
      className="hero hero--banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <picture key={s.src} className={`hslide ${i === idx ? 'active' : ''}`}>
          {s.mobileSrc && <source media="(max-width: 900px)" srcSet={s.mobileSrc} />}
          <img src={s.src} alt={s.alt} onError={() => dropSlide(s.src)} />
        </picture>
      ))}

      {slides.length > 1 && (
        <>
          <button className="hero__arrow hero__arrow--prev" onClick={() => step(-1)} aria-label="Previous banner">
            ←
          </button>
          <button className="hero__arrow hero__arrow--next" onClick={() => step(1)} aria-label="Next banner">
            →
          </button>
          <div className="hero__dots">
            {slides.map((_, i) => (
              <button key={i} className={`hero__dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} aria-label={`Banner ${i + 1}`} />
            ))}
          </div>
        </>
      )}

      <Link href={current?.href || '/collections'} className="hero__shop hero__shop--dark">
        Shop now
      </Link>
    </section>
  );
}
