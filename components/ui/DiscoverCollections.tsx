'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { discoverCollections } from '@/lib/bluorng-data';

export default function DiscoverCollections() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panels = rootRef.current?.querySelectorAll('.discover__panel');
    if (!panels) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.target.classList.toggle('inview', e.isIntersecting));
      },
      { threshold: 0.4 }
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  return (
    <section className="discover" ref={rootRef}>
      <div className="discover__label">Discover collection</div>
      {discoverCollections.map((c) => (
        <div key={c.handle} className="discover__panel">
          <Image src={c.image} alt={c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
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
