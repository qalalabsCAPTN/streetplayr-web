import Link from "next/link";
import { SOCIAL_LINKS } from "@/lib/social";

/** Shared contact block for legal / support pages — single source of truth. */
export default function LegalContact({
  title = "Contact Us",
}: {
  title?: string;
}) {
  return (
    <div className="legal-contact">
      <h2>{title}</h2>
      <div className="legal-contact__row">
        <span className="legal-contact__label">Email</span>
        <a href={SOCIAL_LINKS.emailHref}>{SOCIAL_LINKS.email}</a>
      </div>
      <div className="legal-contact__row">
        <span className="legal-contact__label">Phone</span>
        <a href={SOCIAL_LINKS.phone}>{SOCIAL_LINKS.phoneDisplay}</a>
      </div>
    </div>
  );
}

export function LegalBackHome() {
  return (
    <Link href="/home" className="legal-back">
      ← Return to Home
    </Link>
  );
}
