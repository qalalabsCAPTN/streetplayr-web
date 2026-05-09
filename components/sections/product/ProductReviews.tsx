"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils/format";

type Review = {
  id: string;
  author: string;
  handle: string;
  rating: number;
  title: string;
  body: string;
  purchaseInfo: string;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "ARJUN M.",
    handle: "@arjun_m",
    rating: 5,
    title: "Silhouette Is Insane",
    body: "Dropped straight into the rotation. The drape on this feels nothing like anything else in my closet — it's cut like a second skin but breathes like linen. Got stopped twice on the street asking where it's from.",
    purchaseInfo: "SRH Jersey 01 / Size M",
  },
  {
    id: "r2",
    author: "PRIYA K.",
    handle: "@priya_k",
    rating: 5,
    title: "Finally, Luxury That Moves",
    body: "Took this through a full travel day — 14 hours, two flights, a train — and it still held shape. No piling, no wrinkling where it shouldn't. The weight is perfect for that in-between weather. Worth every rupee.",
    purchaseInfo: "Core Waffle L/S / Size S",
  },
  {
    id: "r3",
    author: "VIKRAM S.",
    handle: "@vikram_sethi",
    rating: 4,
    title: "Built Different",
    body: "Construction is no joke. The stitching along the shoulders, the way the collar sits — you can tell someone actually cared. Only knock is I wish the sleeves were a half-inch longer. Still, my new go-to for shoots.",
    purchaseInfo: "Heavy Zip Hoodie / Size L",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < rating ? "text-white" : "text-white/10"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductReviews() {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 bg-[#050505]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 flex flex-col gap-4"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">
            Testimonials
          </span>
          <h2 className="font-display text-5xl uppercase leading-none tracking-wide text-white md:text-7xl">
            The Verdict
          </h2>
          <p className="max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/40">
            From the streets to the gram — what the community is saying.
          </p>
        </motion.div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_REVIEWS.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 1, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col gap-6 border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all duration-700"
            >
              {/* Rating + Quote */}
              <div className="flex flex-col gap-4">
                <StarRating rating={review.rating} />
                <h3 className="font-display text-xl uppercase tracking-wide text-white/90">
                  &ldquo;{review.title}&rdquo;
                </h3>
              </div>

              {/* Body */}
              <p className="flex-1 font-body text-sm leading-relaxed text-white/60">
                {review.body}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
                    {review.author}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
                    {review.handle}
                  </span>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">
                  {review.purchaseInfo}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <button className="border border-white/20 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 hover:bg-white hover:text-black transition-all duration-500">
            Write a Review
          </button>
        </motion.div>
      </div>
    </section>
  );
}
