'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import Reveal from './BluorngReveal';

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
  variants?: { id: string; size: string }[];
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
 * Product row section. `flat` renders directly on the grey page;
 * otherwise it's a white rounded panel.
 *
 * Discover more:
 * - Desktop: pill in the section head (space to spare).
 * - Mobile: no header pill — quiet "View all" under the row only when the
 *   section is a partial sample (≤3 items). Full rows already show enough;
 *   another fat CTA next to every title is noise.
 */
export default function ProductSection({
  title,
  mobileTitle,
  products,
  moreHref,
  gallery = true,
  grid = false,
  flat = false,
}: ProductSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!products || products.length === 0) return null;

  const displayTitle = isMobile && mobileTitle ? mobileTitle : title;
  const showMobileViewAll = Boolean(moreHref) && products.length <= 3;

  return (
    <section className={`panel ${flat ? 'panel--flat' : ''}`}>
      <div className="panel__head">
        <h2 className="panel__title">{displayTitle}</h2>
        {moreHref && (
          <Link href={moreHref} className="pill pill--ghost panel__more-desktop">
            Discover more
          </Link>
        )}
      </div>
      <Reveal stagger className={grid ? 'pgrid' : 'prow'} as="div">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} gallery={gallery} />
        ))}
      </Reveal>
      {showMobileViewAll && (
        <Link href={moreHref!} className="panel__view-all">
          View all
          <span aria-hidden="true"> →</span>
        </Link>
      )}
    </section>
  );
}
