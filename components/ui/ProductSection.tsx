'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ProductCard from './ProductCard';
import Reveal from './BluorngReveal';

const Product3DCarousel = dynamic(() => import('./Product3DCarousel'), {
  ssr: false,
  loading: () => <div className="prow" aria-hidden />,
});

interface SectionProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  image2?: string;
  category?: string;
  soldOut?: boolean;
  compareAt?: number;
}

interface ProductSectionProps {
  title: string;
  /** Phone-only label (e.g. Topwear / Bottomwear). Desktop keeps `title`. */
  mobileTitle?: string;
  products: SectionProduct[];
  moreHref?: string;
  gallery?: boolean;
  grid?: boolean;
  flat?: boolean;
}

/**
 * Product row section. `flat` renders directly on the grey page (like "Latest drop"
 * in the reference); otherwise it's a white rounded panel.
 */
export default function ProductSection({ title, mobileTitle, products, moreHref, gallery = true, grid = false, flat = false }: ProductSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!products || products.length === 0) return null;

  const displayTitle = isMobile && mobileTitle ? mobileTitle : title;

  return (
    <section className={`panel ${flat ? 'panel--flat' : ''}`}>
      <div className="panel__head">
        <h2 className="panel__title">{displayTitle}</h2>
        {moreHref && (
          <Link href={moreHref} className={`pill ${flat ? 'pill--ghost' : ''}`}>
            Discover more
          </Link>
        )}
      </div>
      {mounted && isMobile && title === 'Latest drop' ? (
        <Product3DCarousel products={products} />
      ) : (
        <Reveal stagger className={grid ? 'pgrid' : 'prow'} as="div">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} gallery={gallery} />
          ))}
        </Reveal>
      )}
    </section>
  );
}
