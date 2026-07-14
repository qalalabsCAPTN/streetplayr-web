import Link from "next/link";

export const metadata = {
  title: "Refund & Exchange Policy — Street PlayR",
  description: "Guidelines and procedures for product returns, refunds, and exchanges.",
};

export default function RefundPolicyPage() {
  return (
    <div className="relative min-h-screen bg-transparent pt-28 md:pt-36 pb-24 px-4 md:px-8 lg:px-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />

      <main className="max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="space-y-4 border-b border-white/[0.08] pb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ddb7ff]">Legal Archive</span>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-[#eadfed]">Refund & Exchange</h1>
          <p className="font-mono text-xs text-white/45">Last Updated: July 2026</p>
        </div>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed tracking-wide uppercase">
          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">1. Drops & Archive Garments</h2>
            <p>Due to the extremely limited quantities and high-demand nature of our drops, items in the "Archive" collection are eligible for exchange only, subject to sizing availability. Refunds will only be provided in the case of manufacturing defects.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">2. Exchange Window</h2>
            <p>You must notify us of exchange requests within 7 days of receiving the package. Items must be returned in unworn, unwashed condition with all original labels and premium dust packaging intact.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">3. Shipping Returns</h2>
            <p>Returned items for exchange will be inspected by our quality assurance team. Return shipping costs are covered by the buyer, unless the return is due to a verifiable manufacturing defect or delivery error.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">4. Process Duration</h2>
            <p>Once returned items are received and cleared by our warehouse, exchanges or credit adjustments will be processed within 5-7 business days. Points earned on returned items in your NECTAR wallet will be adjusted accordingly.</p>
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
