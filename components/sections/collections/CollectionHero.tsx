"use client";

import { useEffect, useState } from "react";
import LazyVideo from "@/components/ui/LazyVideo";

interface CollectionHeroProps {
  title: string;
  description: string;
  imageSrc?: string;
  desktopVideoSrc?: string;
  mobileVideoSrc?: string;
  label?: string;
}

/** Same breakpoint as `.collections-hero` aspect-ratio (not Tailwind `md` / 768px). */
const DESKTOP_MQ = "(min-width: 901px)";

export default function CollectionHero({
  title: _title,
  description,
  imageSrc = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
  desktopVideoSrc = "/banners/collection-desktop.mp4",
  mobileVideoSrc = "/banners/collection-mobile.mp4",
  label = "Collection / SS26",
}: CollectionHeroProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => {
      setSrc(mq.matches ? desktopVideoSrc : mobileVideoSrc);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [desktopVideoSrc, mobileVideoSrc]);

  return (
    <section className="collections-hero relative z-[1] w-full overflow-hidden bg-black">
      {src ? (
        <LazyVideo
          key={src}
          src={src}
          poster={imageSrc}
          aria-hidden="true"
          className="collections-hero__media"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="collections-hero__media"
        />
      )}

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
