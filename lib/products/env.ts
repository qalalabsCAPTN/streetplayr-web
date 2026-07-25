/**
 * Local catalog policy.
 *
 * - USE_LOCAL_CATALOG=1 → always allow demo merch
 * - USE_LOCAL_CATALOG=0 → never allow (strict live-only)
 * - Missing / mock Supabase → allow
 * - Production + live URL → deny by default, BUT callers may pass
 *   `{ rescueEmpty: true }` when the live catalog returned nothing so the
 *   storefront never goes blank (RLS mishap, empty seed, missing membership).
 */
export function allowLocalCatalog(opts?: { rescueEmpty?: boolean }): boolean {
  if (process.env.USE_LOCAL_CATALOG === '1') return true;
  if (process.env.USE_LOCAL_CATALOG === '0') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('mockproject')) return true;
  if (process.env.NODE_ENV === 'production') {
    return opts?.rescueEmpty === true;
  }
  return true;
}

export function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes('mockproject');
}
