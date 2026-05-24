"use client";

import { motion } from "framer-motion";

export default function ProductReviews() {
  return (
    <section className="py-24 px-4 md:px-8 lg:px-12 bg-[#050505]">
      <div className="mx-auto max-w-[min(98vw,2560px)]">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex h-[30vh] flex-col items-center justify-center text-center"
        >
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/30">
            Reviews will appear here once available.
          </p>
        </motion.div>

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
