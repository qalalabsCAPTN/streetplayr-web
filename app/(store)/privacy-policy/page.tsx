import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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

          <div className="legal-contact">
            <h2>5. Contact Us</h2>
            <div className="legal-contact__row">
              <span className="legal-contact__label">Email</span>
              <a href="mailto:info@playR.in">info@playR.in</a>
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
      <Footer />
    </>
  );
}
