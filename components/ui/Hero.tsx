'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.6175;
    if (windowWidth < 1024) return 0.85;
    return 0.95;
  };
  const starScale = getStarScale();

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
      ref={sectionRef}
      className="hero hero--banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <picture key={s.src} className={`hslide ${i === idx ? 'active' : ''}`}>
          {s.mobileSrc && <source media="(max-width: 900px)" srcSet={s.mobileSrc} />}
          <Image src={s.src} alt={s.alt} fill className="object-cover" sizes="100vw" priority={i === idx} onError={() => dropSlide(s.src)} />
        </picture>
      ))}

      {/* Interactive 3D Star Overlay — lazily loaded */}
      <LazyStar scale={starScale} heroRef={sectionRef} />

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

function LazyStar({ scale, heroRef }: { scale: number; heroRef: React.RefObject<HTMLElement | null> }) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idleId = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => setLoaded(true), { timeout: 20000 })
      : setTimeout(() => setLoaded(true), 15000);
    return () => {
      if (typeof idleId === 'number' && typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(idleId);
      else clearTimeout(idleId as NodeJS.Timeout);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    // Dynamically create a script element to load the 3D star component
    // This completely bypasses Turbopack's static analysis, ensuring Three.js
    // is never bundled in the critical path.
    const el = document.createElement('div');
    containerRef.current.appendChild(el);
    let disposed = false;
    import('./NinjaStar').catch(() => {});
    return () => { disposed = true; };
  }, [loaded]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
      <div
        ref={containerRef}
        className="pointer-events-auto flex items-center justify-center w-60 h-60 md:w-[320px] md:h-[320px] lg:w-[420px] lg:h-[420px]"
      />
    </div>
  );
}
