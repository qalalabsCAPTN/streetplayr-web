"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import ImmersiveGallery from "./ImmersiveGallery";

type ProductGalleryProps = {
  images: string[];
};

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(0);

  // For directional hover
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30, mass: 1 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30, mass: 1 });

  const moveX = useTransform(mouseXSpring, [-0.5, 0.5], ["-1.5%", "1.5%"]);
  const moveY = useTransform(mouseYSpring, [-0.5, 0.5], ["-1.5%", "1.5%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const openGallery = (idx: number) => {
    setClickedIndex(idx);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex w-full flex-col gap-12 md:gap-32 pb-24">
        {images.map((src, i) => {
          // Editorial asymmetry logic
          const isHero = i === 0;
          const isLeftAligned = i % 2 !== 0;
          const widthClass = isHero ? "w-full" : "w-[85%] md:w-[70%]";
          const alignmentClass = isHero ? "" : isLeftAligned ? "self-start" : "self-end";
          const paddingClass = isHero ? "" : isLeftAligned ? "pl-0 md:pl-12" : "pr-0 md:pr-12";

          return (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              key={src + i}
              className={`relative overflow-hidden bg-[#0a0a0a] ${widthClass} ${alignmentClass} ${paddingClass} ${
                isHero ? "aspect-[4/5] md:aspect-[3/4]" : "aspect-[3/4]"
              }`}
              onClick={() => openGallery(i)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              data-cursor="zoom"
            >
              <motion.div
                className="h-full w-full"
                style={{
                  x: moveX,
                  y: moveY,
                  scale: 1.05,
                }}
              >
                <Image
                  src={src}
                  alt={`Product detail ${i + 1}`}
                  fill
                  sizes={isHero ? "100vw" : "(min-width: 1024px) 70vw, 85vw"}
                  className="object-cover transition-opacity duration-1000 ease-in-out"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  quality={100}
                  priority={i === 0}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <ImmersiveGallery
        isOpen={isModalOpen}
        images={images}
        initialIndex={clickedIndex}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
