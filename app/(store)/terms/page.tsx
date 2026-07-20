import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — Street PlayR",
  description: "Terms & Conditions of service and membership rules for Street PlayR.",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-transparent pt-28 md:pt-36 pb-24 px-4 md:px-8 lg:px-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />

      <main className="max-w-3xl mx-auto relative z-10 space-y-12">
        <div className="space-y-4 border-b border-white/[0.08] pb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ddb7ff]">Legal Archive</span>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-[#eadfed]">Terms of Service</h1>
          <p className="font-mono text-xs text-white/45">Last Updated: July 2026</p>
        </div>

        <div className="space-y-8 font-mono text-xs md:text-sm text-white/70 leading-relaxed tracking-wide uppercase">
          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">1. Membership & Access</h2>
            <p>StreetPlayR grants selective membership privileges to users. We reserve the right to limit access to exclusive product drops, bot-gated releases, and NECTAR tier progression details in cases of abuse or fraudulent activity.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">2. Drop Rules & Bot-Gating</h2>
            <p>To ensure fair access to limited streetwear drops, we enforce automated bot checks and quantity limitations. Orders determined to be placed using automated scripts or multi-profile exploitation will be immediately cancelled.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">3. Intellectual Property</h2>
            <p>All structural designs, branding graphics, product photography, 3D star designs, and editorial copy exhibited on StreetPlayR are the exclusive property of StreetPlayR Pvt Ltd and may not be reproduced without written authorization.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg tracking-wider text-white">4. Commerce Operations</h2>
            <p>All prices and transactions listed on the store are processed in Indian Rupees (INR) unless specified otherwise. We reserve the right to adjust product pricing, availability, and inventory allocation without notice.</p>
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
