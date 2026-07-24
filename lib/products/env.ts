/**
 * Local catalog is for demo / missing-env only.
 * Never silently replace a live prod catalog with LOCAL_PRODUCTS.
 */
export function allowLocalCatalog(): boolean {
  if (process.env.USE_LOCAL_CATALOG === '1') return true;
  if (process.env.USE_LOCAL_CATALOG === '0') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('mockproject')) return true;
  // Live Supabase configured — no silent local merch in production builds
  if (process.env.NODE_ENV === 'production') return false;
  return true; // local/dev can still fall back when DB empty
}

export function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes('mockproject');
}
