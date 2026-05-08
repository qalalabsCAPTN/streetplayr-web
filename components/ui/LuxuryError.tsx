"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LuxuryErrorProps {
  message?: string;
  retry?: () => void;
  actionLabel?: string;
  actionHref?: string;
}

/**
 * LuxuryError — minimalist, non-technical error state.
 * Maintains brand mythology even in failure states.
 */
export default function LuxuryError({
  message = "A temporary friction has occurred in the play.",
  retry,
  actionLabel,
  actionHref,
}: LuxuryErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[40vh] w-full flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-md space-y-8">
        <h2 className="font-display text-4xl uppercase leading-tight tracking-wide text-white">
          A moment of <br />
          silence.
        </h2>
        
        <p className="font-body text-sm leading-relaxed text-white/40 italic">
          {message || "The connection was briefly interrupted. We are attempting to restore the play."}
        </p>

        <div className="flex flex-col items-center gap-6 pt-12">
          {retry && (
            <button
              onClick={retry}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-white underline underline-offset-8 transition-opacity hover:opacity-70"
            >
              Attempt Reconnection
            </button>
          )}
          
          {actionHref && (
            <Link
              href={actionHref}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-white underline underline-offset-8 transition-opacity hover:opacity-70"
            >
              {actionLabel || "Return to Sanctuary"}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
