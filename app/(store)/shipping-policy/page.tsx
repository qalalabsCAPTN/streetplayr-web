import LegalContact, { LegalBackHome } from "@/components/ui/LegalContact";

export default function ShippingPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Legal</span>
          <h1>Shipping Policy</h1>
          <span className="legal-hero__meta">Last Updated: July 2026</span>
        </div>

        <div className="legal-section">
          <h2>1. Dispatch Timelines</h2>
          <p>Garments from active drops are typically processed and dispatched from our Mumbai facility within 24-48 hours. Items ordered on pre-order campaigns will follow the specific timelines listed on the product details page.</p>
        </div>

        <div className="legal-section">
          <h2>2. Shipping Rates &amp; Delivery</h2>
          <p>We partner with premium express carriers to ensure structured, safe delivery. Standard shipping across India is free for all orders. Express delivery (2-3 business days) is available at checkout for an additional fee.</p>
        </div>

        <div className="legal-section">
          <h2>3. Package Tracking</h2>
          <p>Once your order has been dispatched, a unique tracking number will be linked to your member profile under &quot;Order History&quot;. You will also receive real-time email notifications detailing carrier milestones.</p>
        </div>

        <div className="legal-section">
          <h2>4. Damaged Shipments</h2>
          <p>If your package arrives in a damaged condition, please take photographs before opening it and notify our support team immediately. We will initiate a priority audit and issue a replacement if eligible.</p>
        </div>

        <LegalContact title="5. Contact Us" />
        <LegalBackHome />
      </div>
    </div>
  );
}
