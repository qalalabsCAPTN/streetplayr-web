import Link from "next/link";

const footerLinks = ["Collection", "About", "Points", "Returns"];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-12 sm:px-6 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="font-display text-4xl tracking-[0.14em]" href="/">
            STREET PLAYR
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
            Limited drops, sharp essentials, and PlayR points built for the
            next streetwear habit.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              className="font-mono text-xs uppercase tracking-[0.18em] text-white/55 transition-colors duration-200 hover:text-white"
              href={link === "Collection" ? "/collection" : `/${link.toLowerCase()}`}
              key={link}
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
