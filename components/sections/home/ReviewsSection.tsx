const reviews = [
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

export default function ReviewsSection() {
  return (
    <section className="py-14 md:py-24 pb-20 md:pb-[inherit] px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto">
      <div className="mb-4 md:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-6 bg-white/20 block" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Testimonials</span>
        </div>
        <h2 className="font-display text-[clamp(32px,4.5vw,64px)] uppercase leading-[0.92] text-[#eadfed]">
          What The Streets Say
        </h2>
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {reviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>

      <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-0">
        {reviews.map((review, i) => (
          <div key={i} className="min-w-[92vw] snap-center shrink-0">
            <div className="border border-white/[0.08] p-6 flex flex-col gap-4 rounded-xl bg-transparent">
              <div className="flex items-center gap-2">
                <span className="font-display text-[24px] leading-none text-[#ddb7ff] opacity-[0.08] select-none">
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
              </div>

              <p className="font-body text-base leading-[1.65] text-[rgba(234,223,237,0.72)]">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {review.author}
                </span>
                <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#ddb7ff]/30 ml-auto">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 md:mt-12 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.18]">
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

      <p className="font-body text-sm md:text-base leading-relaxed text-[rgba(234,223,237,0.72)] flex-1">
        &ldquo;{review.text}&rdquo;
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-auto">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[rgba(234,223,237,0.45)]">
          {review.author}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ddb7ff]/40">
          VERIFIED
        </span>
      </div>
    </div>
  );
}
