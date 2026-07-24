'use client';

import LazyVideo from './LazyVideo';

export default function BannerSlider() {
  return (
    <section className="bslider" style={{ position: 'relative', overflow: 'hidden' }}>
      <LazyVideo
        src="/assets/FOR_MOBILE_ST_COLLECTION.mp4"
        poster="/assets/empty_centre.jpg"
        rootMargin="300px 0px"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
        }}
      />
    </section>
  );
}
