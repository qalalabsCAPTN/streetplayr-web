'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Product3DCarousel = dynamic(() => import('./Product3DCarousel'), {
  ssr: false,
  loading: () => (
    <div className="carousel3d" aria-hidden>
      <div className="carousel3d__container" />
    </div>
  ),
});

interface CarouselProduct {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  soldOut?: boolean;
  image: string;
  image2?: string;
}

/**
 * Mobile-only Latest Drop stacked carousel.
 * - CSS hides entire section on desktop (no layout).
 * - Carousel chunk mounts only when viewport ≤900px (no desktop JS load).
 * - Fixed-height placeholder avoids CLS while the dynamic import resolves.
 */
export default function HomeMobileLatestCarousel({
  products,
}: {
  products: CarouselProduct[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!products?.length) return null;

  return (
    <section
      className="panel panel--flat home-latest-carousel"
      aria-label="Latest Drop"
    >
      <div className="panel__head">
        <h2 className="panel__title">Latest Drop</h2>
      </div>
      {isMobile ? (
        <Product3DCarousel products={products} />
      ) : (
        <div className="carousel3d" aria-hidden>
          <div className="carousel3d__container" />
        </div>
      )}
    </section>
  );
}
