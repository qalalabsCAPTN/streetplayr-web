'use client';

import Link from 'next/link';
import Image from 'next/image';
import { discoverCollections } from '@/lib/bluorng-data';

/** Discover strip — no IO / inview class (no CSS consumer; was wasted main-thread work). */
export default function DiscoverCollections() {
  return (
    <section className="discover">
      <div className="discover__label">Discover collection</div>
      {discoverCollections.map((c) => (
        <div key={c.handle} className="discover__panel">
          <Image src={c.image} alt={c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
          <div className="discover__overlay">
            <h2 className="discover__title">{c.title}</h2>
            <Link href={`/collections?category=${c.handle}`} className="btn">
              Shop now
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
