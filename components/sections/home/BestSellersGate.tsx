"use client";

/**
 * BestSellersGate
 *
 * This is the ONLY file that imports both carousels.
 * It reads USE_PREMIUM_CAROUSEL and renders one or the other.
 *
 * ─── TO ACTIVATE THE PREMIUM CAROUSEL ───────────────────────────────────────
 *   Open lib/flags/premiumCarousel.ts
 *   Change `false` to `true` on the last line.
 *   Done — takes < 10 seconds including save.
 *
 * ─── TO ROLLBACK ─────────────────────────────────────────────────────────────
 *   Change it back to `false`.
 *   The original BestSellers is restored instantly.
 *   No other files need to change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * IMPORTANT: The homepage MUST import BestSellersGate instead of BestSellers
 * for the flag to take effect. If the homepage already imports BestSellers
 * directly, replace that import with this component. The props signature
 * is identical — no other changes needed.
 */

import { USE_PREMIUM_CAROUSEL } from "@/lib/flags/premiumCarousel";

// Production baseline — NEVER modified
import BestSellers from "@/components/sections/home/BestSellers";

// Experimental variant — isolated in its own files
import ProductStageBestSellers from "@/components/sections/home/ProductStageBestSellers";

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  image2?: string;
  slug?: string;
  category?: string;
}

interface BestSellersGateProps {
  products: Product[];
}

/**
 * Drop-in replacement for <BestSellers>.
 * Identical props. Identical rendering — unless USE_PREMIUM_CAROUSEL === true.
 */
export default function BestSellersGate({ products }: BestSellersGateProps) {
  if (USE_PREMIUM_CAROUSEL) {
    return <ProductStageBestSellers products={products} />;
  }
  return <BestSellers products={products} />;
}
