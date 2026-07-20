import Link from "next/link";

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
          <h2>2. Shipping Rates & Delivery</h2>
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
