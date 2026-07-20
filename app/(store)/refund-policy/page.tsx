import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Legal</span>
          <h1>Refund & Exchange</h1>
          <span className="legal-hero__meta">Last Updated: July 2026</span>
        </div>

        <div className="legal-section">
          <h2>1. Drops & Archive Garments</h2>
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

        <div className="legal-contact">
          <h2>5. Contact Us</h2>
          <div className="legal-contact__row">
            <span className="legal-contact__label">Email</span>
            <a href="mailto:Orders@playR.in">Orders@playR.in</a>
          </div>
          <div className="legal-contact__row">
            <span className="legal-contact__label">Phone</span>
            <a href="tel:+919599220517">+91 95992 20517</a>
          </div>
        </div>

        <Link href="/home" className="legal-back">
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}
