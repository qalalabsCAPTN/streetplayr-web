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
    <div className="flex w-full flex-col lg:flex-row lg:h-full">
      {/* Left Image Column — Static Featured */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 lg:h-full flex flex-col">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 flex items-center gap-2">
              Outerwear / Limited Release
            </span>
            <h1 className="font-display text-4xl lg:text-5xl uppercase text-white leading-none">
              {title}
            </h1>
          </div>
        </div>
        <div
          className="flex-1 relative bg-[#211c26] overflow-hidden border border-white/10 group"
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
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/[0.38] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Right Image Column — Dynamic / Scrollable Gallery */}
      <div className="w-full lg:w-1/2 lg:h-full lg:min-h-0 p-4 lg:p-8 space-y-6">
        {allImages.slice(1).map((src, i) => (
          <div key={i} className="relative aspect-[4/5] bg-[#211c26] overflow-hidden border border-white/10">
            <Image
              src={src}
              alt={`Detail view ${i + 1}`}
              fill
              sizes="25vw"
              className="object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
