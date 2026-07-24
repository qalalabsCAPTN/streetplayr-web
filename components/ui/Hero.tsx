'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import dynamic from 'next/dynamic';

const NinjaStar = dynamic(() => import('./NinjaStar'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

const SLIDES = [
  {
    // Prefer compressed asset (~0.28MB) over banners/empty centre.jpg (~2.28MB)
    src: '/assets/empty_centre.jpg',
    mobileSrc: '/banners/st-mobile-banner.jpg',
    alt: 'Streetplayr Drop 001',
    href: '/collections',
  },
];

export default function Hero() {
  const [slides, setSlides] = useState(SLIDES);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadStar, setLoadStar] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Defer Three.js until after LCP + idle (or first interaction)
  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const enable = () => setLoadStar(true);

    const onInteract = () => {
      enable();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('touchstart', onInteract);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };

    window.addEventListener('pointerdown', onInteract, { once: true, passive: true });
    window.addEventListener('touchstart', onInteract, { once: true, passive: true });

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(enable, 1800);
    }

    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      cleanup();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Homepage banner star — kept smaller than footer decorative star on mobile.
  const getStarScale = () => {
    if (windowWidth === null) return 0.95;
    if (windowWidth < 768) return 0.65;
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

  return (
    <section
      ref={sectionRef}
      className="hero hero--banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const isActive = i === idx;
        const common = {
          alt: s.alt,
          sizes: '100vw',
          fill: true as const,
          quality: 75,
          priority: isActive,
          className: 'object-cover hero__banner-img',
        };

        const {
          props: { srcSet: desktopSrcSet, ...desktopRest },
        } = getImageProps({ ...common, src: s.src });

        const mobileProps = s.mobileSrc
          ? getImageProps({ ...common, src: s.mobileSrc }).props
          : null;

        return (
          <picture key={s.src} className={`hslide ${isActive ? 'active' : ''}`}>
            {mobileProps && (
              <source
                media="(max-width: 900px)"
                srcSet={mobileProps.srcSet}
                sizes={mobileProps.sizes}
              />
            )}
            {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
            <img
              {...desktopRest}
              srcSet={desktopSrcSet}
              fetchPriority={isActive ? 'high' : 'auto'}
              decoding={isActive ? 'sync' : 'async'}
              loading={isActive ? 'eager' : 'lazy'}
              onError={() => dropSlide(s.src)}
            />
          </picture>
        );
      })}

      {/* Interactive 3D Star — deferred past LCP */}
      {loadStar && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
          <div className="pointer-events-auto flex items-center justify-center w-[min(72vw,280px)] h-[min(72vw,280px)] md:w-[320px] md:h-[320px] lg:w-[420px] lg:h-[420px]">
            <NinjaStar scale={starScale} heroRef={sectionRef} />
          </div>
        </div>
      )}

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
