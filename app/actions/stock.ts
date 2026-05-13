'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

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
 * Get available stock for a specific variant (total - active reservations).
 * Used for realtime stock display on PDP.
 */
export async function getVariantStockAction(
  variantId: string
): Promise<OrchestrationResponse<VariantStock>> {
  try {
    const admin = createAdminClient();

    const { data: variant } = await admin
      .from('product_variants')
      .select('id, stock_quantity')
      .eq('id', variantId)
      .single();

    if (!variant) {
      return { success: false, error: 'Variant not found.', code: 'VARIANT_NOT_FOUND' };
    }

    const { data: reservations } = await admin
      .from('inventory_reservations')
      .select('reserved_quantity')
      .eq('variant_id', variantId)
      .in('reservation_state', ['pending', 'held']);

    const reserved = (reservations ?? []).reduce((sum: number, r: any) => sum + (r.reserved_quantity ?? 0), 0);

    return {
      success: true,
      data: {
        variantId: variant.id,
        stockQuantity: variant.stock_quantity ?? 0,
        reservedQuantity: reserved,
        available: Math.max(0, (variant.stock_quantity ?? 0) - reserved),
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'STOCK_CHECK_ERROR' };
  }
}

/**
 * Validate all items in a cart against available stock.
 * Called before initiating checkout to prevent oversell.
 */
export async function validateCartStockAction(
  items: { variantId: string; quantity: number }[]
): Promise<OrchestrationResponse<{ valid: boolean; failures: CartStockCheck[] }>> {
  try {
    const admin = createAdminClient();
    const failures: CartStockCheck[] = [];

    for (const item of items) {
      const { data: variant } = await admin
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variantId)
        .single();

      if (!variant) {
        failures.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: 0,
          sufficient: false,
        });
        continue;
      }

      const { data: reservations } = await admin
        .from('inventory_reservations')
        .select('reserved_quantity')
        .eq('variant_id', item.variantId)
        .in('reservation_state', ['pending', 'held']);

      const reserved = (reservations ?? []).reduce((sum: number, r: any) => sum + (r.reserved_quantity ?? 0), 0);
      const available = Math.max(0, (variant.stock_quantity ?? 0) - reserved);

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
