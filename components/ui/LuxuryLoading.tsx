"use client";

import { motion } from "framer-motion";

/**
 * LuxuryLoading — cinematic, restrained loading state.
 * Avoids generic spinners in favor of atmospheric opacity fades.
 */
export default function LuxuryLoading() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="relative flex flex-col items-center gap-6">
        {/* Minimalist animated stroke */}
        <motion.div
          animate={{ 
            opacity: [0, 0.4, 0],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="h-[1px] w-48 bg-white/20"
        />
        <motion.span
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/40"
        >
          Visualizing Presence
        </motion.span>
      </div>
    </div>
  );
}
