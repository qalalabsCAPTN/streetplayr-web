/**
 * Last-known-good catalog snapshot.
 * Used when live Supabase fails in production — never swap to demo SKUs.
 *
 * Server: in-memory (per instance). Survives soft failures between warm requests.
 * Client: sessionStorage mirror for /collections browser loader.
 */

import type { CatalogProduct } from '@/lib/products/queries';

const TTL_MS = 60 * 60 * 1000; // serve stale up to 1h after last success
/** Bump when catalog shape / media mapping changes so stale session LKG can't blank cards. */
const CLIENT_KEY = 'sp.catalog.lkg.v2';

type LkgEntry = {
  products: CatalogProduct[];
  savedAt: number;
};

let memoryLkg: LkgEntry | null = null;

export type CatalogSource = 'live' | 'lkg' | 'local' | 'empty';

export function saveCatalogLkg(products: CatalogProduct[]): void {
  if (!products || products.length === 0) return;
  memoryLkg = { products, savedAt: Date.now() };
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        CLIENT_KEY,
        JSON.stringify({ products, savedAt: Date.now() } satisfies LkgEntry)
      );
    } catch {
      // quota / private mode — ignore
    }
  }
}

export function readCatalogLkg(): { products: CatalogProduct[]; ageMs: number } | null {
  const entry = memoryLkg ?? readClientLkg();
  if (!entry || entry.products.length === 0) return null;
  const ageMs = Date.now() - entry.savedAt;
  // Keep serving beyond TTL (better than empty/demo); callers log stale
  void TTL_MS;
  return { products: entry.products, ageMs };
}

function readClientLkg(): LkgEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLIENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LkgEntry;
    if (!Array.isArray(parsed?.products) || parsed.products.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function logCatalogDegraded(source: CatalogSource, detail?: string): void {
  const msg = `[catalog] degraded source=${source}${detail ? ` — ${detail}` : ''}`;
  if (source === 'empty') console.error(msg);
  else console.warn(msg);
}
