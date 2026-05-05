"use client";

import { motion } from "framer-motion";

export type ColorOption = {
  id: string;
  name: string;
  hex: string;
};

type ColorSelectorProps = {
  colors: ColorOption[];
  selectedColorId: string;
  onSelect: (id: string) => void;
};

export default function ColorSelector({
  colors,
  selectedColorId,
  onSelect,
}: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          Color
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-white">
          {colors.find((c) => c.id === selectedColorId)?.name}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selectedColorId === color.id;
          return (
            <button
              key={color.id}
              onClick={() => onSelect(color.id)}
              className="group relative flex h-10 w-10 items-center justify-center border transition-colors duration-300"
              style={{
                borderColor: isSelected ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Select color ${color.name}`}
            >
              <span
                className="h-[80%] w-[80%] transition-transform duration-300 group-hover:scale-90"
                style={{ backgroundColor: color.hex }}
              />
              {isSelected && (
                <motion.div
                  layoutId="color-indicator"
                  className="absolute -bottom-2 h-px w-4 bg-white"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
