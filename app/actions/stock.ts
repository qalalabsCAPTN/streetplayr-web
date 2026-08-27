'use server';

import { getAvailableInventory } from '@/lib/inventory';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';
import { resolveStorefrontBrandId } from '@/lib/products/brand';

interface VariantStock {
  variantId: string;
  stockQuantity: number;
  reservedQuantity: number;
  available: number;
}

interface CartStockCheck {
  variantId: string;
  requested: number;
  available: number;
  sufficient: boolean;
}

/**
 * Get available stock for a specific variant.
 * Uses the inventory abstraction layer — DEMO_INVENTORY_MODE safe.
 */
export async function getVariantStockAction(
  variantId: string
): Promise<OrchestrationResponse<VariantStock>> {
  try {
    const admin = createAdminClient();

    const { data: variant } = await admin
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .single();

    if (!variant) {
      return { success: false, error: 'Variant not found.', code: 'VARIANT_NOT_FOUND' };
    }

    const { data: inv } = await admin
      .from('inventory')
      .select('quantity')
      .eq('variant_id', variantId)
      .maybeSingle();

    const { data: reservations } = await admin
      .from('inventory_reservations')
      .select('reserved_quantity')
      .eq('variant_id', variantId)
      .in('reservation_state', ['pending', 'held']);

    const reserved = (reservations ?? []).reduce((sum: number, r: any) => sum + (r.reserved_quantity ?? 0), 0);
    const available = await getAvailableInventory(variantId);

    return {
      success: true,
      data: {
        variantId: variant.id,
        stockQuantity: inv?.quantity ?? 0,
        reservedQuantity: reserved,
        available,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'STOCK_CHECK_ERROR' };
  }
}

/**
 * Validate all items in a cart against available stock.
 * Called before initiating checkout to prevent oversell.
 * Uses the inventory abstraction layer.
 */
export async function validateCartStockAction(
  items: { variantId: string; quantity: number }[]
): Promise<OrchestrationResponse<{ valid: boolean; failures: CartStockCheck[] }>> {
  try {
    const admin = createAdminClient();
    const brandId = await resolveStorefrontBrandId(admin);
    const failures: CartStockCheck[] = [];

    for (const item of items) {
      const { data: owned } = await admin
        .from('product_variants')
        .select('id, products!inner(brand_id)')
        .eq('id', item.variantId)
        .eq('products.brand_id', brandId)
        .maybeSingle();

      if (!owned) {
        failures.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: 0,
          sufficient: false,
        });
        continue;
      }

      const available = await getAvailableInventory(item.variantId);

      if (available < item.quantity) {
        failures.push({
          variantId: item.variantId,
          requested: item.quantity,
          available,
          sufficient: false,
        });
      }
    }

    if (failures.length > 0) {
      await recordEvent({
        domain: 'inventory',
        severity: 'warning',
        action: 'cart.stock_validation_failed',
        actorId: 'system',
        resourceType: 'cart',
        resourceId: 'validation',
        message: `Cart stock validation failed for ${failures.length} items`,
        metadata: { failures: failures.map(f => ({ variantId: f.variantId, requested: f.requested, available: f.available })) },
      });

      return { success: true, data: { valid: false, failures } };
    }

    return { success: true, data: { valid: true, failures: [] } };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'VALIDATION_ERROR' };
  }
}

/** Batch available qty from inventory minus active reservations. */
export async function getCatalogAvailabilityAction(
  variantIds: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(variantIds.filter(Boolean))].slice(0, 500);
  const out: Record<string, number> = {};
  if (unique.length === 0) return out;

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
    for (const id of unique) out[id] = 0;
    for (const row of inv ?? []) {
      out[row.variant_id] = Math.max(
        0,
        Number(row.quantity ?? 0) - (reservedBy.get(row.variant_id) ?? 0)
      );
    }
  } catch {
    for (const id of unique) out[id] = 0;
  }
  return out;
}
