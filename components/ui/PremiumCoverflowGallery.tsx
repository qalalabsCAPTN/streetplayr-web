"use client";

/**
 * PremiumCoverflowGallery
 *
 * Mobile PDP image slider — native horizontal scroll-snap carousel,
 * matching the original reference design's `pdp__carousel` behavior:
 *   • Plain CSS overflow-x scroll with scroll-snap-type: x mandatory
 *   • One full-width slide per view (scroll-snap-align: start)
 *   • Active index derived from scroll position (no drag physics)
 *   • "n / total" counter overlay, bottom-left
 */

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface PremiumCoverflowGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export default function PremiumCoverflowGallery({
  images,
  title,
  className = "",
}: PremiumCoverflowGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  if (!count) return null;

  return (
    <div className={`w-full ${className}`}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} image gallery`}
        style={{ position: "relative" }}
      >
        <div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            borderRadius: 20,
            scrollbarWidth: "none",
          }}
          className="no-scrollbar"
        >
          {images.map((src, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}
            >
              <Image
                src={src}
                alt={`${title} detail view ${index + 1}`}
                width={600}
                height={800}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                style={{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  objectFit: "cover",
                  display: "block",
                  background: "#1c1622",
                }}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 14,
              fontSize: 13,
              color: "#fff",
              pointerEvents: "none",
            }}
          >
            {activeIndex + 1} / {count}
          </div>
        )}
      </div>
    </div>
  );
}
