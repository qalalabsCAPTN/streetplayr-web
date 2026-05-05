"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type ImmersiveGalleryProps = {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function ImmersiveGallery({
  isOpen,
  images,
  initialIndex,
  onClose,
}: ImmersiveGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-8 top-8 z-50 text-white mix-blend-difference hover:opacity-70 transition-opacity"
            data-cursor="product"
            aria-label="Close gallery"
          >
            <span className="font-mono text-xs uppercase tracking-widest">Close</span>
          </button>

          {/* Navigation */}
          <button
            onClick={prevImage}
            className="absolute left-8 top-1/2 z-50 -translate-y-1/2 p-4 text-white mix-blend-difference hover:opacity-70 transition-opacity"
            data-cursor="product"
            aria-label="Previous image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={nextImage}
            className="absolute right-8 top-1/2 z-50 -translate-y-1/2 p-4 text-white mix-blend-difference hover:opacity-70 transition-opacity"
            data-cursor="product"
            aria-label="Next image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Image Container */}
          <div className="relative h-[90vh] w-[90vw] max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-full w-full"
                onClick={(e) => e.stopPropagation()}
                data-cursor="drag"
              >
                <Image
                  src={images[currentIndex]}
                  alt={`Gallery image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  quality={100}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicator */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-px transition-all duration-500 ${
                  i === currentIndex ? "w-8 bg-white" : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
