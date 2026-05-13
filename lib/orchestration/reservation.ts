/**
 * Reservation Orchestration Service
 *
 * Stripe-independent reservation lifecycle management.
 * All state transitions are idempotent and server-authoritative.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  InventoryReservation,
  ReservationState,
  ReservationSource,
  OrchestrationResponse,
} from './types';
import { recordEvent } from './events';

const DEFAULT_TTL_MINUTES = 15;

function reservationStateFromDb(row: any): InventoryReservation {
  return {
    id: row.id,
    cartId: row.cart_id,
    orderId: row.order_id,
    productId: row.product_id,
    variantId: row.variant_id,
    reservedQuantity: row.reserved_quantity,
    reservationState: row.reservation_state,
    reservationOwner: row.reservation_owner,
    expiresAt: row.expires_at,
    convertedAt: row.converted_at,
    releasedAt: row.released_at,
    createdAt: row.created_at,
  };
}

export const ReservationService = {
  /**
   * Reserve inventory atomically.
   * Uses the `reserve_inventory` RPC for race-condition-safe creation.
   */
  async create(
    variantId: string,
    productId: string,
    quantity: number,
    ownerId: string,
    source: ReservationSource = 'checkout_enter',
    ttlMinutes: number = DEFAULT_TTL_MINUTES,
    orderId?: string
  ): Promise<OrchestrationResponse<InventoryReservation>> {
    try {
      const admin = createAdminClient();
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

      const { data: reservationId, error } = await admin.rpc('reserve_inventory', {
        p_variant_id: variantId,
        p_product_id: productId,
        p_quantity: quantity,
        p_owner: ownerId,
        p_expires_at: expiresAt,
      });

      if (error) {
        const isStock = error.message.includes('Insufficient stock');
        return {
          success: false,
          error: isStock ? 'Insufficient stock available.' : error.message,
          code: isStock ? 'INSUFFICIENT_STOCK' : 'RESERVATION_FAILED',
        };
      }

      // Link reservation to order if provided
      if (orderId) {
        await admin
          .from('inventory_reservations')
          .update({ order_id: orderId })
          .eq('id', reservationId);
      }

      // Fetch the created reservation
      const { data: row } = await admin
        .from('inventory_reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!row) {
        return { success: false, error: 'Reservation created but not found.', code: 'RESERVATION_NOT_FOUND' };
      }

      await recordEvent({
        domain: 'reservation',
        severity: 'info',
        action: 'reservation.created',
        actorId: ownerId,
        resourceType: 'inventory_reservations',
        resourceId: row.id,
        message: `Reserved ${quantity}x of variant ${variantId}`,
        metadata: { source, variantId, productId, quantity, expiresAt, orderId },
      });

      return { success: true, data: reservationStateFromDb(row) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'RESERVATION_ERROR' };
    }
  },

  /**
   * Transition reservation from pending → held.
   * Called when PaymentIntent is created.
   */
  async hold(
    reservationId: string,
    actorId: string
  ): Promise<OrchestrationResponse<InventoryReservation>> {
    return this.transitionState(reservationId, 'held', actorId, 'payment_intent_created');
  },

  /**
   * Transition reservation from held → converted.
   * Called when payment is confirmed (webhook).
   * Stock is permanently deducted at this point.
   */
  async convert(
    reservationId: string,
    actorId: string
  ): Promise<OrchestrationResponse<InventoryReservation>> {
    const result = await this.transitionState(reservationId, 'converted', actorId, 'payment_confirmed');

    if (result.success) {
      await recordEvent({
        domain: 'inventory',
        severity: 'info',
        action: 'stock.deducted',
        actorId,
        resourceType: 'inventory_reservations',
        resourceId: reservationId,
        message: 'Reservation converted — stock permanently deducted',
        metadata: { reservationId },
      });

      // Emit inventory.changed for realtime awareness
      if (result.data) {
        await recordEvent({
          domain: 'inventory',
          severity: 'info',
          action: 'inventory.changed',
          actorId,
          resourceType: 'product_variants',
          resourceId: result.data.variantId,
          message: `Inventory changed for variant ${result.data.variantId}: -${result.data.reservedQuantity}`,
          metadata: {
            variantId: result.data.variantId,
            productId: result.data.productId,
            delta: -result.data.reservedQuantity,
            reason: 'payment_confirmed',
          },
        });
      }
    }

    return result;
  },

  /**
   * Release a reservation back to available pool.
   * Can be called from any non-terminal state.
   */
  async release(
    reservationId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<InventoryReservation>> {
    const result = await this.transitionState(reservationId, 'released', actorId, 'system_release');

    if (result.success) {
      await recordEvent({
        domain: 'reservation',
        severity: reason === 'payment_failed' ? 'warning' : 'info',
        action: 'reservation.released',
        actorId,
        resourceType: 'inventory_reservations',
        resourceId: reservationId,
        message: reason ? `Reservation released: ${reason}` : 'Reservation released',
        metadata: { reservationId, reason },
      });
    }

    return result;
  },

  /**
   * Expire reservations that have exceeded their TTL.
   * Called by cron or on-read.
   */
  async releaseExpired(): Promise<OrchestrationResponse<{ released: number }>> {
    try {
      const admin = createAdminClient();
      const { data: count, error } = await admin.rpc('release_expired_reservations');

      if (error) {
        return { success: false, error: error.message, code: 'EXPIRY_FAILED' };
      }

      if (count > 0) {
        await recordEvent({
          domain: 'reservation',
          severity: 'info',
          action: 'reservation.expired_batch',
          actorId: 'system',
          resourceType: 'inventory_reservations',
          resourceId: 'batch',
          message: `Released ${count} expired reservations`,
          metadata: { count },
        });
      }

      return { success: true, data: { released: count ?? 0 } };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'EXPIRY_ERROR' };
    }
  },

  /**
   * Get available stock for a variant (total - active reservations - confirmed orders).
   */
  async getAvailableStock(variantId: string): Promise<number> {
    try {
      const admin = createAdminClient();
      const { data: variant } = await admin
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single();

      if (!variant) return 0;

      const { data: reserved } = await admin
        .from('inventory_reservations')
        .select('reserved_quantity')
        .eq('variant_id', variantId)
        .in('reservation_state', ['pending', 'held']);

      const reservedTotal = (reserved ?? []).reduce(
        (sum, r) => sum + (r.reserved_quantity ?? 0),
        0
      );

      return Math.max(0, (variant.stock_quantity ?? 0) - reservedTotal);
    } catch {
      return 0;
    }
  },

  /**
   * Internal state transition with validation.
   */
  async transitionState(
    reservationId: string,
    targetState: ReservationState,
    actorId: string,
    source: ReservationSource
  ): Promise<OrchestrationResponse<InventoryReservation>> {
    try {
      const admin = createAdminClient();

      // Valid transition map
      const validTransitions: Record<ReservationState, ReservationState[]> = {
        pending: ['held', 'released', 'expired'],
        held: ['converted', 'released', 'expired'],
        converted: ['released'],
        released: [],
        expired: ['released'],
      };

      // Fetch current state
      const { data: current } = await admin
        .from('inventory_reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!current) {
        return { success: false, error: 'Reservation not found.', code: 'NOT_FOUND' };
      }

      if (!validTransitions[current.reservation_state as ReservationState]?.includes(targetState)) {
        return {
          success: false,
          error: `Cannot transition from ${current.reservation_state} to ${targetState}`,
          code: 'INVALID_TRANSITION',
        };
      }

      const update: Record<string, any> = {
        reservation_state: targetState,
      };

      if (targetState === 'converted') update.converted_at = new Date().toISOString();
      if (targetState === 'released') update.released_at = new Date().toISOString();

      const { data: updated } = await admin
        .from('inventory_reservations')
        .update(update)
        .eq('id', reservationId)
        .select('*')
        .single();

      if (!updated) {
        return { success: false, error: 'Failed to update reservation.', code: 'UPDATE_FAILED' };
      }

      return { success: true, data: reservationStateFromDb(updated) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'TRANSITION_ERROR' };
    }
  },

  /**
   * Get all active (non-terminal) reservations for a user.
   */
  async getActiveForUser(userId: string): Promise<InventoryReservation[]> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('inventory_reservations')
        .select('*')
        .eq('reservation_owner', userId)
        .in('reservation_state', ['pending', 'held'])
        .order('created_at', { ascending: false });

      return (data ?? []).map(reservationStateFromDb);
    } catch {
      return [];
    }
  },
};
