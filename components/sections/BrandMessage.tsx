"use client";

import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

const stats = [
  { label: "Launch Products", value: "08" },
  { label: "PlayR Points", value: "640" },
  { label: "Return Window", value: "30D" },
];

function MascotMark() {
  return (
    <svg aria-hidden="true" className="h-28 w-40 text-white/20" fill="none" viewBox="0 0 220 140">
      <path
        d="M26 82c19 8 45 11 78 10 35-1 64-7 88-18 8-4 15 6 10 14l-13 19c-5 7-12 11-21 11H66c-21 0-38-9-51-27-5-7 3-13 11-9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M53 75c14-24 31-36 51-36 17 0 29 8 39 24m-72-6 20 19m5-28 25 28m8-20 21 16"
        stroke="var(--sp-accent)"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="178" cy="56" fill="currentColor" r="10" />
    </svg>
  );
}

export default function BrandMessage() {
  return (
    <section className="bg-black px-4 py-20 sm:px-6 lg:px-16">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden border border-white/10 bg-[var(--sp-bg-surface)] p-6 sm:p-10 lg:p-14">
          <div className="absolute right-5 top-5 hidden lg:block">
            <MascotMark />
          </div>

          <div className="max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-accent)]">
              Our Message
            </p>
            <h2 className="mt-4 text-balance font-display text-5xl leading-[0.95] tracking-[0.1em] sm:text-7xl lg:text-8xl">
              WE DO NOT FOLLOW STREETS. WE BUILD THEM.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              StreetplayR is built for people who choose their uniform before
              the room chooses a label for them. Every piece is direct, sharp,
              and made to earn repeat wear.
            </p>
            <Link
              className="mt-8 inline-flex font-mono text-xs uppercase tracking-[0.2em] text-white transition-colors duration-200 hover:text-[var(--sp-accent)]"
              href="/collections"
            >
              Shop Collection -&gt;
            </Link>
          </div>

          <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-3">
            {stats.map((stat) => (
              <div className="bg-[var(--sp-bg-surface)] p-5" key={stat.label}>
                <p className="font-display text-5xl leading-none tracking-[0.1em] text-white">
                  {stat.value}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/48">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
