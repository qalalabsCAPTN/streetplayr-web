import Link from "next/link";

const footerLinks = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Logistics", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--sp-bg-surface)] w-full py-12 px-4 md:px-16 border-t border-grid-line">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="font-display text-[48px] leading-none text-[var(--sp-accent)]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: "0.02em" }}>
            StreetplayR
          </Link>
          <p className="font-hud text-[var(--sp-text-muted)] opacity-80">© 2024 STREETPLAYR // CORE_OS_V1.0</p>
        </div>
        <div className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-hud text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent-2)] opacity-80 hover:opacity-100 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-4">
          <button className="w-10 h-10 flex items-center justify-center border border-[var(--sp-border-subtle)] hover:border-[var(--sp-accent)] transition-colors text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border border-[var(--sp-border-subtle)] hover:border-[var(--sp-accent)] transition-colors text-[var(--sp-text-secondary)] hover:text-[var(--sp-accent)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
