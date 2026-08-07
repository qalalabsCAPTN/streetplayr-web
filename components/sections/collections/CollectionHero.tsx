"use client";

import Image from "next/image";

interface CollectionHeroProps {
  title: string;
  description: string;
  imageSrc: string;
  label?: string;
}

export default function CollectionHero({
  title,
  description,
  imageSrc,
  label = "Collection / SS26",
}: CollectionHeroProps) {
  return (
    <section className="collections-hero relative z-[1] w-full overflow-hidden">
      <Image
        src={imageSrc}
        alt={`${title} Campaign Hero`}
        fill
        priority
        sizes="100vw"
        className="collections-hero__img"
      />
      <div className="collections-hero__overlay" />
      <div className="collections-hero__content absolute inset-0 z-[1] flex items-end">
        <div className="collections-hero__container w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
          <span className="collections-hero__label">{label}</span>
          <h1 className="collections-hero__title">{title}</h1>
          <p className="collections-hero__desc">{description}</p>
          <div className="collections-hero__buttons">
            <a href="#collections-products" className="chip chip--view-all active">
              Explore Drop
            </a>
            <a href="#collections-products" className="chip">
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
