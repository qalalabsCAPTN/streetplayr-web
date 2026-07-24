'use client';

import type { CSSProperties } from 'react';
import LazyVideo from './LazyVideo';

const videoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'absolute',
  inset: 0,
};

export default function BannerSlider() {
  return (
    <section className="bslider" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Desktop — collections motion banner */}
      <LazyVideo
        src="/assets/COLLECTION_MOTION_BANNER.mp4"
        poster="/assets/empty_centre.jpg"
        rootMargin="300px 0px"
        className="hidden md:block"
        style={videoStyle}
      />
      {/* Mobile — portrait collection clip */}
      <LazyVideo
        src="/assets/FOR_MOBILE_ST_COLLECTION.mp4"
        poster="/assets/empty_centre.jpg"
        rootMargin="300px 0px"
        className="md:hidden"
        style={{ ...videoStyle, objectPosition: 'center 35%' }}
      />
    </section>
  );
}
