"use client";

import { motion } from "framer-motion";

const categories = ["ALL", "TEES", "HOODIES", "OUTERWEAR"];

interface CategoryFilterProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="sticky top-[72px] z-40 w-full border-b border-[#1e1e1e] bg-[#0a0a0a]/80 backdrop-blur-md md:top-[88px]">
      <div className="mx-auto max-w-[min(95vw,2400px)] px-4 md:px-6 py-4 md:py-6">
        <div className="no-scrollbar flex w-full overflow-x-auto">
          <div className="flex items-center gap-8 md:gap-12 lg:gap-16">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => onSelect(category)}
                  className="group relative whitespace-nowrap pb-2 outline-none"
                  data-cursor="button"
                >
                  <span
                    className={`font-mono text-[11px] md:text-xs font-bold tracking-[0.15em] transition-colors duration-500 ease-out ${
                      isActive ? "text-white" : "text-[#4a4a4a] group-hover:text-[#8c8c8c]"
                    }`}
                  >
                    {category}
                  </span>
                  
                  {/* Active Indicator Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute bottom-0 left-0 h-[2px] w-full bg-[var(--sp-accent)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover Underline Fallback (if not active) */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#333333] transition-all duration-300 ease-out group-hover:w-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
