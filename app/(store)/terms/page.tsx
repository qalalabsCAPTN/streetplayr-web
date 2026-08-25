import LegalContact, { LegalBackHome } from "@/components/ui/LegalContact";

export default function TermsPage() {
  return (
    <div className="legal-page pt-20">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Legal</span>
          <h1>Terms of Service</h1>
          <span className="legal-hero__meta">Last Updated: August 2026</span>
        </div>

        <div className="legal-section">
          <h2>1. Membership &amp; Access</h2>
          <p>StreetplayR grants selective membership privileges to users. We reserve the right to limit access to exclusive product drops, bot-gated releases, and member-credit progression in cases of abuse or fraudulent activity.</p>
        </div>

        <div className="legal-section">
          <h2>2. Drop Rules &amp; Bot-Gating</h2>
          <p>To ensure fair access to limited streetwear drops, we enforce automated bot checks and quantity limitations. Orders determined to be placed using automated scripts or multi-profile exploitation will be immediately cancelled.</p>
        </div>

        <div className="legal-section">
          <h2>3. Intellectual Property</h2>
          <p>All structural designs, branding graphics, product photography, 3D star designs, and editorial copy exhibited on StreetplayR are the exclusive property of StreetplayR and may not be reproduced without written authorization.</p>
        </div>

        <div className="legal-section">
          <h2>4. Commerce Operations</h2>
          <p>All prices and transactions listed on the store are processed in Indian Rupees (INR) unless specified otherwise. We reserve the right to adjust product pricing, availability, and inventory allocation without notice.</p>
        </div>

        <LegalContact title="5. Contact Information" />
        <LegalBackHome />
      </div>
    </div>
  );
}
