import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ExchangesPage() {
  return (
    <>
      <Navbar />
      <div className="legal-page pt-20">
        <div className="legal-shell">
          <div className="legal-hero">
            <span className="legal-hero__eyebrow">Legal</span>
            <h1>Exchanges</h1>
            <span className="legal-hero__meta">Last Updated: July 2026</span>
          </div>

          <div className="legal-section">
            <h2>1. Exchange Window</h2>
            <p>You can exchange any product within 7 days of delivery. Our team will assist in picking up the item and delivering your new product once the exchange is confirmed.</p>
          </div>

          <div className="legal-section">
            <h2>2. How to Request an Exchange</h2>
            <p>Log in to your account, go to &quot;Manage Your Order&quot;, and select the item you wish to exchange. If you checked out as a guest, create an account using the same email used at checkout to view and manage your order.</p>
          </div>

          <div className="legal-section">
            <h2>3. Processing Time</h2>
            <p>Once your returned item is received at our warehouse, we will email you a confirmation of receipt. Refunds or exchange credit are processed within 7 days of receiving the returned package.</p>
          </div>

          <div className="legal-contact">
            <h2>4. Contact Support</h2>
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
      <Footer />
    </>
  );
}
