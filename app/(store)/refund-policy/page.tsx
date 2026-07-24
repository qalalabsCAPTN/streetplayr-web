import LegalContact, { LegalBackHome } from "@/components/ui/LegalContact";

export default function RefundPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Legal</span>
          <h1>Refund &amp; Exchange</h1>
          <span className="legal-hero__meta">Last Updated: July 2026</span>
        </div>

        <div className="legal-section">
          <h2>1. Drops &amp; Archive Garments</h2>
          <p>Due to the extremely limited quantities and high-demand nature of our drops, items in the &quot;Archive&quot; collection are eligible for exchange only, subject to sizing availability. Refunds will only be provided in the case of manufacturing defects.</p>
        </div>

        <div className="legal-section">
          <h2>2. Exchange Window</h2>
          <p>You must notify us of exchange requests within 7 days of receiving the package. Items must be returned in unworn, unwashed condition with all original labels and premium dust packaging intact.</p>
        </div>

        <div className="legal-section">
          <h2>3. Shipping Returns</h2>
          <p>Returned items for exchange will be inspected by our quality assurance team. Return shipping costs are covered by the buyer, unless the return is due to a verifiable manufacturing defect or delivery error.</p>
        </div>

        <div className="legal-section">
          <h2>4. Process Duration</h2>
          <p>Once returned items are received and cleared by our warehouse, exchanges or credit adjustments will be processed within 5-7 business days. Points earned on returned items in your NECTAR wallet will be adjusted accordingly.</p>
        </div>

        <LegalContact title="5. Contact Us" />
        <LegalBackHome />
      </div>
    </div>
  );
}
