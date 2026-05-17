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
    <section className="py-28 px-4 md:px-16 max-w-[1440px] mx-auto">
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">[</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(234,223,237,0.52)]">Testimonials</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff]">]</span>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-[#ddb7ff]/30 via-white/[0.06] to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="bg-[#1f1a23] border border-white/[0.08] p-8 flex flex-col"
          >
            <div className="flex items-center gap-1.5 mb-5">
              {Array.from({ length: 5 }, (_, s) => (
                <svg
                  key={s}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#eadfed"
                  stroke="none"
                  opacity="0.3"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-[rgba(234,223,237,0.68)] flex-1">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(234,223,237,0.42)]">
                {review.author}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/[0.12]">
                VERIFIED
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.18]">
          Testimonials collected post-purchase &middot; Unedited
        </span>
      </div>
    </section>
  );
}
