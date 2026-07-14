import Link from "next/link";

export const metadata = {
  title: "Shipping Policy — Street PlayR",
  description: "Shipping timelines, carrier options, and tracking details for Street PlayR members.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="relative min-h-screen bg-transparent pt-28 md:pt-36 pb-24 px-4 md:px-8 lg:px-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />

      <main className="max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="space-y-4 border-b border-white/[0.08] pb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ddb7ff]">Legal Archive</span>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-[#eadfed]">Shipping Policy</h1>
          <p className="font-mono text-xs text-white/45">Last Updated: July 2026</p>
        </div>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed tracking-wide uppercase">
          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">1. Dispatch Timelines</h2>
            <p>Garments from active drops are typically processed and dispatched from our Mumbai facility within 24-48 hours. Items ordered on pre-order campaigns will follow the specific timelines listed on the product details page.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">2. Shipping Rates & Delivery</h2>
            <p>We partner with premium express carriers to ensure structured, safe delivery. Standard shipping across India is free for all orders. Express delivery (2-3 business days) is available at checkout for an additional fee.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">3. Package Tracking</h2>
            <p>Once your order has been dispatched, a unique tracking number will be linked to your member profile under "Order History". You will also receive real-time email notifications detailing carrier milestones.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">4. Damaged Shipments</h2>
            <p>If your package arrives in a damaged condition, please take photographs before opening it and notify our support team immediately at support@streetplayr.com. We will initiate a priority audit and issue a replacement if eligible.</p>
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
