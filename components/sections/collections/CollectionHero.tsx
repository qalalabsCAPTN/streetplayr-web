"use client";

import Image from "next/image";

interface CollectionHeroProps {
  title: string;
  description: string;
  imageSrc?: string;
  desktopVideoSrc?: string;
  mobileVideoSrc?: string;
  label?: string;
}

export default function CollectionHero({
  title,
  description,
  imageSrc = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
  desktopVideoSrc = "/banners/collection-desktop.mp4",
  mobileVideoSrc = "/banners/collection-mobile.mp4",
  label = "Collection / SS26",
}: CollectionHeroProps) {
  return (
    <section className="collections-hero relative z-[1] w-full overflow-hidden bg-black">
      {/* Mobile MP4 Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        poster={imageSrc}
        className="collections-hero__img md:hidden object-cover w-full h-full absolute inset-0"
      >
        <source src={mobileVideoSrc} type="video/mp4" />
      </video>

      {/* Desktop MP4 Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        poster={imageSrc}
        className="collections-hero__img hidden md:block object-cover w-full h-full absolute inset-0"
      >
        <source src={desktopVideoSrc} type="video/mp4" />
      </video>

      <div className="collections-hero__overlay" />
      <div className="collections-hero__content absolute inset-0 z-[1] flex items-end">
        <div className="collections-hero__container w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
          <span className="collections-hero__label">{label}</span>
          <p className="collections-hero__desc">{description}</p>
        </div>
      </div>
    </section>
  );
}
