import Link from "next/link";

interface ComingSoonProps {
  eyebrow: string;
  title: string;
  message: string;
}

export default function ComingSoon({ eyebrow, title, message }: ComingSoonProps) {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <span className="legal-hero__meta">Coming soon</span>
        </div>

        <div className="legal-section">
          <p>{message}</p>
        </div>

        <Link href="/home" className="legal-back">
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}
