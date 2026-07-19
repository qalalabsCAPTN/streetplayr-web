'use client';

export default function BannerSlider() {
  return (
    <section className="bslider" style={{ position: 'relative', overflow: 'hidden' }}>
      <video
        src="/banners/FOR MOBILE ST COLLECTION.mp4"
        autoPlay
        loop
        muted
        playsInline
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
