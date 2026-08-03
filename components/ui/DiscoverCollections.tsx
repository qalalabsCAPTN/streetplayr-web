'use client';

import Link from 'next/link';
import Image from 'next/image';
import { discoverCollections } from '@/lib/bluorng-data';

/** Discover strip — horizontal scroll-snap carousel (mobile / tablet). */
export default function DiscoverCollections() {
  const total = discoverCollections.length;

  return (
    <section className="discover">
      <div className="discover__label">Discover collection</div>
      <div
        className="discover__track"
        role="region"
        aria-roledescription="carousel"
        aria-label="Discover collections"
      >
        {discoverCollections.map((c, i) => (
          <div
            key={c.handle}
            className="discover__panel"
            role="group"
            aria-roledescription="slide"
            aria-label={`${c.title}, ${i + 1} of ${total}`}
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
                className="storefront-cta storefront-cta--inline"
              >
                Shop now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
