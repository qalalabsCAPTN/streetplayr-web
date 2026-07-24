import LegalContact, { LegalBackHome } from "@/components/ui/LegalContact";

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
          <h2>Let&apos;s build something</h2>
          <p>playR is built on street culture — clean silhouettes, limited runs, and pieces that hold their own. We&apos;re always open to collaborating with brands, artists, and creators who share that same edge, whether it&apos;s a capsule drop, a print collab, or something we haven&apos;t tried yet.</p>
        </div>

        <div className="legal-section">
          <h2>What we look for</h2>
          <p>A distinct point of view, a story worth telling, and a willingness to make something limited rather than mass — that&apos;s it. If that&apos;s you, we want to hear the idea, not just the pitch.</p>
        </div>

        <LegalContact title="Get in touch" />
        <LegalBackHome />
      </div>
    </div>
  );
}
