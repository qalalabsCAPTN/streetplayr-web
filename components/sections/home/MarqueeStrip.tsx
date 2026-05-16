export default function MarqueeStrip() {
  return (
    <div className="bg-[var(--sp-accent-deep)] py-4 border-y border-[var(--sp-border-subtle)] overflow-hidden whitespace-nowrap">
      <div className="flex gap-12 animate-marquee font-display text-[42px] md:text-[64px] text-[var(--sp-on-primary-container)] opacity-90" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
        <span>STREETPLAYR // STREETPLAYR // STREETPLAYR // STREETPLAYR // STREETPLAYR // STREETPLAYR // STREETPLAYR //</span>
      </div>
    </div>
  );
}
