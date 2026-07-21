import Link from "next/link";

/* Placeholder brand copy — no confirmed collab program details exist yet.
   Swap for real copy once the client provides it. */
export default function CollaborationsPage() {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">We are playR</span>
          <h1>Collaborations</h1>
          <span className="legal-hero__meta">Brands, artists &amp; creators</span>
        </div>

        <div className="legal-section">
          <h2>Let's build something</h2>
          <p>playR is built on street culture — clean silhouettes, limited runs, and pieces that hold their own. We're always open to collaborating with brands, artists, and creators who share that same edge, whether it's a capsule drop, a print collab, or something we haven't tried yet.</p>
        </div>

        <div className="legal-section">
          <h2>What we look for</h2>
          <p>A distinct point of view, a story worth telling, and a willingness to make something limited rather than mass — that's it. If that's you, we want to hear the idea, not just the pitch.</p>
        </div>

        <div className="legal-contact">
          <h2>Get in touch</h2>
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
