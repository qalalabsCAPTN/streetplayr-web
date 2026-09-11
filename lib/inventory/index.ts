import { createAdminClient } from '@/lib/supabase/admin';
import { netAvailable } from './net-available';

export { netAvailable };

const DEMO_MODE = process.env.DEMO_INVENTORY_MODE === 'true';

/**
 * Get available inventory for a variant.
 *
 * In DEMO_INVENTORY_MODE, returns 100 for any active variant.
 * In production, uses inventory.quantity minus active reservations
 * (not product_variants.stock_quantity — that column is absent on live CRM schema).
 *
 * Future: When Unicommerce is integrated, this function will pull from
 * the synced inventory table or Unicommerce inventory API.
 * No caller will need to change.
 */
export async function getAvailableInventory(variantId: string): Promise<number> {
  const batch = await getAvailableInventoryBatch([variantId]);
  return batch[variantId] ?? 0;
}

/** Same purchasability rule as getAvailableInventory, one round-trip for many variants. */
export async function getAvailableInventoryBatch(
  variantIds: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(variantIds.filter(Boolean))];
  const out: Record<string, number> = {};
  for (const id of unique) out[id] = DEMO_MODE ? 100 : 0;
  if (DEMO_MODE || unique.length === 0) return out;

  try {
    const admin = createAdminClient();
    const { data: inv } = await admin
      .from('inventory')
      .select('variant_id, quantity')
      .in('variant_id', unique);

    const { data: reservations } = await admin
      .from('inventory_reservations')
      .select('variant_id, reserved_quantity')
      .in('variant_id', unique)
      .in('reservation_state', ['pending', 'held']);

    const reservedBy = new Map<string, number>();
    for (const row of reservations ?? []) {
      reservedBy.set(
        row.variant_id,
        (reservedBy.get(row.variant_id) ?? 0) + Number(row.reserved_quantity ?? 0)
      );
    }
    for (const row of inv ?? []) {
      out[row.variant_id] = netAvailable(
        Number(row.quantity ?? 0),
        reservedBy.get(row.variant_id) ?? 0
      );
    }
  } catch {
    return out;
  }
  return out;
}
