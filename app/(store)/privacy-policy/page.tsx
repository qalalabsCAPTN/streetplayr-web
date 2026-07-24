import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalContact, { LegalBackHome } from "@/components/ui/LegalContact";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="legal-page pt-20">
        <div className="legal-shell">
          <div className="legal-hero">
            <span className="legal-hero__eyebrow">Legal</span>
            <h1>Privacy Policy</h1>
            <span className="legal-hero__meta">Last Updated: July 2026</span>
          </div>

          <div className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>We collect details you provide when joining the release list, making a purchase, or participating in our NECTAR rewards ecosystem. This includes your name, email address, shipping address, and membership profile details.</p>
          </div>

          <div className="legal-section">
            <h2>2. How We Use Your Data</h2>
            <p>Your details are used solely to orchestrate exclusive drops, process secure commerce orders, prevent botting during drop gates, and calculate loyalty tier multipliers (STREET/PLAYER/LEGEND).</p>
          </div>

          <div className="legal-section">
            <h2>3. NECTAR Ecosystem</h2>
            <p>By registering on StreetPlayR, your wallet rewards, transactions, and event milestones are synchronized across all connected universes (PlayR, PlayR Club, PlayR Game) to maintain your unified progression state.</p>
          </div>

          <div className="legal-section">
            <h2>4. Cookies & Storage</h2>
            <p>We use localized browser storage (localStorage) to store configuration parameters such as your closed popup status and session tokens to optimize visual performance and reduce layout shifts.</p>
          </div>

          <LegalContact title="5. Contact Us" />
          <LegalBackHome />
        </div>
      </div>
      <Footer />
    </>
  );
}
