'use server';

import { getAvailableInventory, getAvailableInventoryBatch } from '@/lib/inventory';
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
    const ownedItems: { variantId: string; quantity: number }[] = [];

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

      ownedItems.push(item);
    }

    const availableById = await getAvailableInventoryBatch(
      ownedItems.map((item) => item.variantId)
    );

    for (const item of ownedItems) {
      const available = availableById[item.variantId] ?? 0;
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
  return getAvailableInventoryBatch(variantIds.filter(Boolean).slice(0, 500));
}
