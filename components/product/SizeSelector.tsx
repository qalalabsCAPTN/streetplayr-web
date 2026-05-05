"use client";

type SizeSelectorProps = {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
  fitIntelligence?: string; // e.g. "Model is 6'2 wearing L"
  fitType?: string; // e.g. "Oversized Boxy"
  trueToSize?: boolean;
};

export default function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  fitIntelligence,
  fitType,
  trueToSize,
}: SizeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          Size
        </span>
        {fitIntelligence && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
            {fitIntelligence}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              onClick={() => onSelect(size)}
              className={`flex h-12 items-center justify-center border font-mono text-[11px] uppercase tracking-widest transition-all duration-300 ${
                isSelected
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-transparent text-white hover:border-white/40 hover:bg-white/5"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>

      {(fitType || trueToSize) && (
        <div className="flex items-center gap-4 border-t border-white/5 pt-3">
          {fitType && (
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-white" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Fit: {fitType}
              </span>
            </div>
          )}
          {trueToSize && (
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-white" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                True To Size
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
