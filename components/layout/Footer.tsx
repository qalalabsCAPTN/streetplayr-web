export default function Footer() {
  return (
    <footer className="foot w-full bg-[#050505] border-t border-[rgba(255,255,255,0.10)] px-6 md:px-[6vw]">
      <div className="foot-brand py-12 border-b border-[rgba(255,255,255,0.10)]">
        <span
          className="font-gothic text-[28px] text-white"
          style={{ fontFamily: "'Anton', sans-serif", letterSpacing: "0.02em" }}
        >
          StreetplayR
        </span>
        <p className="text-[13px] text-[#7a7a7a] leading-relaxed max-w-[480px] mt-3 font-mono text-[10px] tracking-[0.3em] uppercase">
          Designed in Mumbai. Engineered for the universe. Part of the iCorETS
          ecosystem &mdash; one wallet, one identity, every drop.
        </p>
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] uppercase mt-3 block">
          &copy; 2026 STREETPLAYR PVT LTD
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
        <div className="flex flex-col gap-3">
          <h5 className="font-mono text-[10px] tracking-[0.5em] text-[#c77dff] uppercase mb-2">
            Shop
          </h5>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Collection
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Lookbook
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Archive
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Gift Cards
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h5 className="font-mono text-[10px] tracking-[0.5em] text-[#c77dff] uppercase mb-2">
            Universe
          </h5>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            iCorETS
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Universal Wallet
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Apex Pass
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Referrals
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h5 className="font-mono text-[10px] tracking-[0.5em] text-[#c77dff] uppercase mb-2">
            Support
          </h5>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Sizing
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Shipping
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Returns
          </a>
          <a href="#" className="font-mono text-[10px] tracking-[0.3em] text-[#7a7a7a] hover:text-white transition-colors uppercase">
            Contact
          </a>
        </div>
      </div>

      <div className="foot-legal border-t border-[rgba(255,255,255,0.10)] py-6 flex flex-col md:flex-row justify-between gap-2 font-mono text-[10px] tracking-[0.3em] text-[#4d4d4d] uppercase">
        <span>FW26 &middot; DROP 01 &middot; v1.0.0</span>
        <span>SYSTEM ONLINE &middot; MUMBAI 04:18 IST</span>
      </div>
    </footer>
  );
}
