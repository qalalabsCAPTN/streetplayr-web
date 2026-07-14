import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Street PlayR",
  description: "Privacy Policy and data protection guidelines for Street PlayR members.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen bg-transparent pt-28 md:pt-36 pb-24 px-4 md:px-8 lg:px-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />

      <main className="max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="space-y-4 border-b border-white/[0.08] pb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ddb7ff]">Legal Archive</span>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-[#eadfed]">Privacy Policy</h1>
          <p className="font-mono text-xs text-white/45">Last Updated: July 2026</p>
        </div>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed tracking-wide uppercase">
          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">1. Information We Collect</h2>
            <p>We collect details you provide when joining the release list, making a purchase, or participating in our NECTAR rewards ecosystem. This includes your name, email address, shipping address, and membership profile details.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">2. How We Use Your Data</h2>
            <p>Your details are used solely to orchestrate exclusive drops, process secure commerce orders, prevent botting during drop gates, and calculate loyalty tier multipliers (STREET/PLAYER/LEGEND).</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">3. NECTAR Ecosystem</h2>
            <p>By registering on StreetPlayR, your wallet rewards, transactions, and event milestones are synchronized across all connected universes (PlayR, PlayR Club, PlayR Game) to maintain your unified progression state.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">4. Cookies & Storage</h2>
            <p>We use localized browser storage (localStorage) to store configuration parameters such as your closed popup status and session tokens to optimize visual performance and reduce layout shifts.</p>
          </section>
        </div>

        <div className="pt-8 border-t border-white/[0.08]">
          <Link href="/home" className="font-mono text-xs uppercase tracking-[0.2em] text-[#ddb7ff] hover:underline">
            ← Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
