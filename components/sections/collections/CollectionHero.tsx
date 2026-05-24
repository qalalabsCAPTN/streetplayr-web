"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function CollectionHero() {
  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-noise flex flex-col justify-end pb-12 pt-32 md:pb-24">
      {/* Background imagery / Grain is handled by bg-noise and grid-floor if needed, but let's add a cinematic image */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=2000&auto=format&fit=crop"
          alt="Collection Atmosphere"
          fill
          className="object-cover opacity-30 grayscale mix-blend-luminosity"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[min(98vw,2560px)] px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          {/* Typography Collision Area */}
          <div className="flex flex-col">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <h1 className="font-display text-[15vw] leading-[0.8] tracking-tighter text-white uppercase md:text-[10vw]">
                Defy
              </h1>
            </motion.div>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
              className="overflow-hidden md:ml-[10vw]"
            >
              <h1 className="font-display text-[15vw] leading-[0.8] tracking-tighter text-white uppercase opacity-80 md:text-[10vw]">
                Standard
              </h1>
            </motion.div>
          </div>

          {/* Context / Metadata */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="flex max-w-sm flex-col gap-4 border-l border-white/20 pl-6 md:pl-8"
          >
            <p className="font-body text-sm leading-relaxed text-[#8c8c8c] md:text-base">
              A curated archive of heavyweight structural garments. Stripped of excess, defined by form. Engineered for the streets.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
