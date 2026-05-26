/**
 * FEATURE FLAG — Premium 3D CoverFlow Carousel
 *
 * ─── HOW TO ACTIVATE ────────────────────────────────────────────────────────
 *   Change the line below to `true`.
 *   That is literally the only change required.
 *
 * ─── HOW TO ROLLBACK ────────────────────────────────────────────────────────
 *   Change the line below back to `false`.
 *   Takes < 5 seconds. Zero other files need to be touched.
 *
 * ─── ENV OVERRIDE (optional) ────────────────────────────────────────────────
 *   Set NEXT_PUBLIC_PREMIUM_CAROUSEL=true in .env.local to override at runtime
 *   without changing this file. Useful for staging deploys.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const USE_PREMIUM_CAROUSEL =
  process.env.NEXT_PUBLIC_PREMIUM_CAROUSEL === "true"
    ? true
    : true; // ← FLIP THIS to `false` to revert to the production carousel

