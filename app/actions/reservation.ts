'use server';

import { ReservationService } from '@/lib/orchestration/reservation';
import { createClient } from '@/lib/supabase/server';
import type { OrchestrationResponse, InventoryReservation } from '@/lib/orchestration/types';

/**
 * Reserve inventory when user enters checkout.
 */
export async function reserveInventoryAction(
  variantId: string,
  productId: string,
  quantity: number
): Promise<OrchestrationResponse<InventoryReservation>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    return await ReservationService.create(
      variantId,
      productId,
      quantity,
      user.id
    );
  } catch (e: any) {
    return { success: false, error: e.message, code: 'RESERVATION_ACTION_ERROR' };
  }
}

/**
 * Release a reservation (user cancels checkout or back to cart).
 */
export async function releaseReservationAction(
  reservationId: string
): Promise<OrchestrationResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const result = await ReservationService.release(
      reservationId,
      user.id,
      'user_cancelled_checkout'
    );

    return {
      success: result.success,
      error: result.error,
      code: result.code,
    };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'RELEASE_ACTION_ERROR' };
  }
}

/**
 * Get available stock for a variant (for PDP display).
 */
export async function getAvailableStockAction(
  variantId: string
): Promise<OrchestrationResponse<{ available: number }>> {
  try {
    const available = await ReservationService.getAvailableStock(variantId);
    return { success: true, data: { available } };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'STOCK_CHECK_ERROR' };
  }
}

/**
 * Get active reservations for the current user.
 */
export async function getMyReservationsAction(): Promise<OrchestrationResponse<InventoryReservation[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const reservations = await ReservationService.getActiveForUser(user.id);
    return { success: true, data: reservations };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'FETCH_RESERVATIONS_ERROR' };
  }
}
