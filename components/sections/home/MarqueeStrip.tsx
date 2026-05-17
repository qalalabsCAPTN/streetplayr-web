export default function MarqueeStrip() {
  return (
    <div className="bg-[#1b1620] py-5 border-y border-white/[0.10] overflow-hidden whitespace-nowrap">
      <div className="flex gap-12 animate-marquee font-display text-[42px] md:text-[64px] text-[rgba(234,223,237,0.14)] opacity-90 tracking-[0.02em]">
        <span>STREETPLAYR / STREETPLAYR / STREETPLAYR / STREETPLAYR / STREETPLAYR / STREETPLAYR / STREETPLAYR /</span>
      </div>
    </div>
  );
}
