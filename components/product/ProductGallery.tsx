"use client";

import { useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  title: string;
  heroImage: string;
};

export default function ProductGallery({ images, title, heroImage }: ProductGalleryProps) {
  const [heroHovered, setHeroHovered] = useState(false);
  const allImages = images.length > 1 ? images : [heroImage, heroImage];

  return (
    <div className="flex w-full flex-col lg:flex-row lg:max-h-[calc(100vh-96px)]">
      {/* Left Image Column — Static Featured */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 flex flex-col">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sp-accent)] flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--sp-accent)] animate-pulse rounded-full" />
              LIVE_DROP // SESSION_774
            </span>
            <h1 className="font-display text-4xl lg:text-5xl uppercase text-white leading-none">
              {title}
            </h1>
          </div>
        </div>
        <div
          className="flex-1 relative bg-[#050505] overflow-hidden border border-white/5 group"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
        >
          <Image
            src={heroImage}
            alt="Hero view of product"
            fill
            sizes="50vw"
            className={`object-cover transition-all duration-700 ${
              heroHovered ? "grayscale-0 scale-105" : "grayscale brightness-75"
            }`}
            priority
          />
          <div className="absolute top-4 left-4 font-mono text-[10px] text-white bg-black/60 p-1 border border-white/20 backdrop-blur-sm">
            FRAME_01 // MAIN_VIEW
          </div>
          <div className="absolute inset-0 border-[20px] border-transparent pointer-events-none">
            <div className="w-full h-full border border-white/10 flex items-center justify-center">
              <div className="w-12 h-12 border-t-2 border-l-2 border-white/40 absolute top-0 left-0" />
              <div className="w-12 h-12 border-t-2 border-r-2 border-white/40 absolute top-0 right-0" />
              <div className="w-12 h-12 border-b-2 border-l-2 border-white/40 absolute bottom-0 left-0" />
              <div className="w-12 h-12 border-b-2 border-r-2 border-white/40 absolute bottom-0 right-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Image Column — Dynamic / Scrollable Gallery */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 lg:overflow-y-auto space-y-6">
        {allImages.slice(1).map((src, i) => (
          <div key={i} className="relative aspect-[4/5] bg-[#050505] overflow-hidden border border-white/5">
            <Image
              src={src}
              alt={`Detail view ${i + 1}`}
              fill
              sizes="25vw"
              className="object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
            <div className="absolute top-4 left-4 font-mono text-[10px] text-white bg-black/60 p-1 border border-white/20 backdrop-blur-sm">
              FRAME_{String(i + 2).padStart(2, "0")} // SYSTEM_DETAIL
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
