"use client";

type SizeSelectorProps = {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
};

export default function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
}: SizeSelectorProps) {
  return (
    <div className="size-matrix">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={`size-cell ${selectedSize === size ? "active" : ""}`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
