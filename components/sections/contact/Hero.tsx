"use client";

import { motion } from "framer-motion";

export default function ContactHero() {
  return (
    <section className="relative min-h-[50vh] w-full flex items-end overflow-hidden bg-[#16111b] pt-32 pb-16 sm:pb-24">
      {/* Premium background grid & glows */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(221,183,255,0.08),transparent_60%),radial-gradient(800px_500px_at_10%_80%,rgba(255,87,26,0.04),transparent_50%)]" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#16111b] to-transparent pointer-events-none" />

      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12">
        <div className="max-w-[min(98vw,2560px)] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 block mb-8">
              Contact
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(72px,12vw,160px)] leading-[0.96] tracking-[0.01em] uppercase text-[#eadfed] max-w-[12ch]"
          >
            Establish
            <br />
            <span className="text-[#ddb7ff]">Contact</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-white/35 mt-10 max-w-[480px] leading-relaxed"
          >
            Connect with the collective. For support, design feedback, or partnerships, broadcast your message below.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
