'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { stories } from '@/lib/bluorng-data';

/**
 * Homepage Stories row — mobile-only (CSS).
 * Horizontal snap scroll with always-visible prev/next arrows (no hide-on-idle).
 */
export default function StoriesBar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const scrollBy = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(280, Math.max(160, el.clientWidth * 0.65));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <>
      <section className="stories-bar" aria-label="Stories">
        <button
          type="button"
          className="stories-bar__arrow stories-bar__arrow--prev"
          onClick={() => scrollBy(-1)}
          aria-label="Previous stories"
        >
          ←
        </button>
        <div className="stories" ref={trackRef}>
          {stories.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className="story"
              onClick={() => setActive(i)}
              aria-label={s.label}
            >
              <span className="story__ring">
                <Image src={s.image} alt="" width={56} height={56} className="rounded-full object-cover" />
              </span>
              <span className="story__label">{s.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="stories-bar__arrow stories-bar__arrow--next"
          onClick={() => scrollBy(1)}
          aria-label="Next stories"
        >
          →
        </button>
      </section>

      {active !== null && (
        <div className="storyviewer" onClick={() => setActive(null)} role="dialog" aria-label="Story viewer">
          <button type="button" className="storyviewer__close" aria-label="Close" onClick={() => setActive(null)}>
            ×
          </button>
          <button
            type="button"
            className="storyviewer__side"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : Math.max(0, i - 1)));
            }}
            aria-label="Previous story"
          >
            ←
          </button>
          <div className="storyviewer__card" onClick={(e) => e.stopPropagation()}>
            <Image
              src={stories[active].image}
              alt={stories[active].label}
              width={400}
              height={600}
              className="w-full h-full object-cover"
            />
            <Link href={stories[active].href} className="storyviewer__cta" onClick={() => setActive(null)}>
              {stories[active].cta}
            </Link>
          </div>
          <button
            type="button"
            className="storyviewer__side"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : Math.min(stories.length - 1, i + 1)));
            }}
            aria-label="Next story"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
