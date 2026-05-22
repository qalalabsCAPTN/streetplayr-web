import { createAdminClient } from '@/lib/supabase/admin';

const DEMO_MODE = process.env.DEMO_INVENTORY_MODE === 'true';

/**
 * Get available inventory for a variant.
 *
 * In DEMO_INVENTORY_MODE, returns 100 for any active variant.
 * In production, calculates stock_quantity minus active reservations.
 *
 * Future: When Unicommerce is integrated, this function will pull from
 * the synced inventory table or Unicommerce inventory API.
 * No caller will need to change.
 */
export async function getAvailableInventory(variantId: string): Promise<number> {
  if (DEMO_MODE) {
    return 100;
  }
  return getDatabaseInventory(variantId);
}

/**
 * Get available stock from the database — Supabase product_variants
 * minus active reservations.
 *
 * Replace this function's internals when connecting to Unicommerce
 * or any external inventory source.
 */
async function getDatabaseInventory(variantId: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (!variant) return 0;

    const { data: reservations } = await admin
      .from('inventory_reservations')
      .select('reserved_quantity')
      .eq('variant_id', variantId)
      .in('reservation_state', ['pending', 'held']);

    const reserved = (reservations ?? []).reduce(
      (sum: number, r: any) => sum + (r.reserved_quantity ?? 0),
      0
    );

    return Math.max(0, (variant.stock_quantity ?? 0) - reserved);
  } catch {
    return 0;
  }
}
