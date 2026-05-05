"use client";

type QuantitySelectorProps = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
}: QuantitySelectorProps) {
  return (
    <div className="flex h-12 w-32 items-center justify-between border border-white/20 px-4">
      <button
        onClick={onDecrease}
        disabled={quantity <= 1}
        className="text-white/50 transition-colors hover:text-white disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
          <path d="M0 0H12V2H0V0Z" />
        </svg>
      </button>
      
      <span className="font-mono text-xs text-white">{quantity}</span>
      
      <button
        onClick={onIncrease}
        className="text-white/50 transition-colors hover:text-white"
        aria-label="Increase quantity"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M5 5V0H7V5H12V7H7V12H5V7H0V5H5Z" />
        </svg>
      </button>
    </div>
  );
}
