'use client';

import Image from 'next/image';

/**
 * Mid-home collection banner — project-owned still only.
 * Stock promo slides / non-playR mock videos removed.
 */
export default function BannerSlider() {
  return (
    <section
      className="bslider"
      style={{ position: 'relative', overflow: 'hidden' }}
      aria-label="Collection banner"
    >
      <Image
        src="/assets/empty_centre.jpg"
        alt="playR collection"
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
    </section>
  );
}
