"use client";

import { useState } from "react";

interface Testimonial {
  text: string;
  author: string;
}

interface ReviewsSectionProps {
  heading?: string;
  reviews?: Testimonial[];
}

const defaultReviews = [
  {
    text: "The quality is unreal. You can feel the weight of the fabric the moment you put it on. Definitely worth every rupee.",
    author: "Arjun M.",
  },
  {
    text: "Finally a brand that gets the aesthetic right. Fits perfect, looks even better in person. Already copped three pieces.",
    author: "Rohan K.",
  },
  {
    text: "Been wearing the waffle tee for a month now — no pilling, no fading. This is how streetwear should be made.",
    author: "Priya S.",
  },
];

export default function ReviewsSection({
  heading = "What The Streets Say",
  reviews,
}: ReviewsSectionProps = {}) {
  const activeReviews = reviews && reviews.length > 0 ? reviews : defaultReviews;
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? activeReviews.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === activeReviews.length - 1 ? 0 : c + 1));

  return (
    <section className="py-14 md:py-24 pb-20 md:pb-[inherit] px-4 md:px-8 lg:px-12 w-full max-w-[min(98vw,2560px)] mx-auto">
      <div className="mb-4 md:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">Testimonials</span>
        </div>
        <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92]">
          {heading}
        </h2>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {activeReviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>

      {/* Mobile: controlled slider — one card at a time, no overflow */}
      <div className="md:hidden w-full overflow-hidden">
        {/* Card */}
        <div className="border border-white/[0.08] p-6 flex flex-col gap-4 rounded-xl bg-transparent w-full">
          <div className="flex items-center gap-2">
            <span className="font-display text-[24px] leading-none text-[#ddb7ff] opacity-[0.08] select-none">
              &ldquo;
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, s) => (
                <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#ddb7ff" stroke="none" opacity="0.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>

          <p className="font-body text-base leading-[1.65] opacity-70">
            &ldquo;{activeReviews[current].text}&rdquo;
          </p>

          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">
              {activeReviews[current].author}
            </span>
            <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#ddb7ff]/30 ml-auto">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Controls: prev / dots / next */}
        <div className="flex items-center justify-between mt-5 px-1">
          <button
            onClick={prev}
            aria-label="Previous review"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 opacity-40 hover:opacity-70 hover:border-white/25 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {activeReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-4 h-1.5 bg-[#ddb7ff]/70"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next review"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 opacity-40 hover:opacity-70 hover:border-white/25 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4 md:mt-12 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-[0.18]">
          Verified purchases &middot; Real reviews
        </span>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: { text: string; author: string } }) {
  return (
    <div className="border border-white/[0.08] p-6 md:p-8 flex flex-col gap-4 rounded-xl bg-transparent hover:border-white/[0.14] transition-colors">
      <span className="font-display text-[56px] md:text-[72px] leading-none text-[#ddb7ff]/10 select-none">
        &ldquo;
      </span>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, s) => (
          <svg
            key={s}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#ddb7ff"
            stroke="none"
            opacity="0.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>

      <p className="font-body text-sm md:text-base leading-relaxed opacity-70 flex-1">
        &ldquo;{review.text}&rdquo;
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-auto">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-45">
          {review.author}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ddb7ff]/40">
          VERIFIED
        </span>
      </div>
    </div>
  );
}
