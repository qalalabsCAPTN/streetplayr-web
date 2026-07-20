import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Legal</span>
          <h1>Terms of Service</h1>
          <span className="legal-hero__meta">Last Updated: July 2026</span>
        </div>

        <div className="legal-section">
          <h2>1. Membership & Access</h2>
          <p>StreetPlayR grants selective membership privileges to users. We reserve the right to limit access to exclusive product drops, bot-gated releases, and NECTAR tier progression details in cases of abuse or fraudulent activity.</p>
        </div>

        <div className="legal-section">
          <h2>2. Drop Rules & Bot-Gating</h2>
          <p>To ensure fair access to limited streetwear drops, we enforce automated bot checks and quantity limitations. Orders determined to be placed using automated scripts or multi-profile exploitation will be immediately cancelled.</p>
        </div>

        <div className="legal-section">
          <h2>3. Intellectual Property</h2>
          <p>All structural designs, branding graphics, product photography, 3D star designs, and editorial copy exhibited on StreetPlayR are the exclusive property of StreetPlayR Pvt Ltd and may not be reproduced without written authorization.</p>
        </div>

        <div className="legal-section">
          <h2>4. Commerce Operations</h2>
          <p>All prices and transactions listed on the store are processed in Indian Rupees (INR) unless specified otherwise. We reserve the right to adjust product pricing, availability, and inventory allocation without notice.</p>
        </div>

        <div className="legal-contact">
          <h2>5. Contact Information</h2>
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
