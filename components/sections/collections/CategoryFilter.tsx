"use client";

const categories = ["ALL", "TEES", "HOODIES", "OUTERWEAR"];

interface CategoryFilterProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

const getDisplayLabel = (cat: string) => {
  if (cat === "ALL") return "View All";
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
};

export default function CategoryFilter({ activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="w-full">
      <div className="flex flex-row flex-wrap gap-2.5 md:gap-3 justify-start items-center">
        {categories.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`px-5 py-2.5 rounded-full font-mono text-[11px] md:text-xs font-bold tracking-[0.12em] transition-all duration-300 ease-out text-center select-none focus:outline-none border cursor-pointer hover:scale-[1.03] active:scale-[0.98] ${
                isActive 
                  ? "bg-[#eadfed] text-[#16111b] border-[#eadfed] shadow-[0_4px_12px_rgba(234,223,237,0.12)]" 
                  : "bg-transparent text-[rgba(234,223,237,0.6)] border-white/10 hover:text-white hover:border-white/30 hover:bg-white/[0.02]"
              }`}
              data-cursor="button"
            >
              {getDisplayLabel(category)}
            </button>
          );
        })}
      </div>
    </div>
  );
}



