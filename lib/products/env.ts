/**
 * Catalog policy — production commerce rules.
 *
 * USE_LOCAL_CATALOG=1  → intentionally allow demo/local merch (dev, demos, emergency)
 * USE_LOCAL_CATALOG=0  → never allow (force live/LKG/empty)
 * Default production   → NEVER serve demo merch (even missing/mock URL or DB outage)
 * Default development  → allow local when DB empty / mock / missing env
 *
 * Outages: last-known-good snapshot or empty catalog — never auto-demo in production.
 */
export function allowLocalCatalog(): boolean {
  if (process.env.USE_LOCAL_CATALOG === '1') return true;
  if (process.env.USE_LOCAL_CATALOG === '0') return false;
  // Production: explicit flag only — missing/mock URL must NOT unlock demo merch
  if (process.env.NODE_ENV === 'production') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('mockproject')) return true;
  return true; // local/dev may fall back when live DB empty
}

export function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes('mockproject');
}

/** True when we may backfill collection membership from the static local map. */
export function allowLocalMembershipFallback(): boolean {
  return allowLocalCatalog();
}
