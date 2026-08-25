/**
 * Reconciliation Service
 *
 * Periodic checks to detect and resolve inconsistent state between
 * payment providers, orders, reservations, and inventory.
 *
 * Run by cron or manually from OpsOS.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { OrderService } from './order';
import { PaymentService } from './payment';
import { ReservationService } from './reservation';
import { recordEvent } from './events';

export const ReconciliationService = {
  /**
   * Find orders stuck pending payment with no recent activity.
   * These may have payments that succeeded with the provider (any gateway
   * routed through PaymentService) but weren't captured/confirmed locally.
   *
   * Status value corrected to match the LIVE orders_status_check constraint
   * (verified via pg_dump — see audit report): 'pending', not
   * 'pending_payment'. The migration-file vocabulary this previously used
   * was never applied to the live DB, so this query never matched a single
   * real row.
   */
  async findOrphanedPayments(hoursOld = 24): Promise<string[]> {
    try {
      const admin = createAdminClient();
      const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

      const { data } = await admin
        .from('orders')
        .select('id, payment_intent_id')
        .eq('status', 'pending')
        .lt('created_at', cutoff)
        .not('payment_intent_id', 'is', null);

      const results: string[] = [];

      for (const order of data ?? []) {
        const confirmed = await PaymentService.isPaymentConfirmed(order.payment_intent_id);

        if (confirmed) {
          // Payment succeeded but order is stuck — auto-fix
          await OrderService.confirm(order.id, 'system');
          results.push(order.id);

          await recordEvent({
            domain: 'payment',
            severity: 'warning',
            action: 'reconciliation.order_confirmed',
            actorId: 'system',
            resourceType: 'orders',
            resourceId: order.id,
            message: `Order auto-confirmed during reconciliation — payment was already settled`,
            metadata: { paymentIntentId: order.payment_intent_id },
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  },

  /**
   * Release reservations that have been stuck in 'held' state
   * with no corresponding order activity for too long.
   */
  async releaseStaleReservations(hoursOld = 2): Promise<number> {
    try {
      const admin = createAdminClient();
      const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

      const { data: stale } = await admin
        .from('inventory_reservations')
        .select('id')
        .eq('reservation_state', 'held')
        .lt('created_at', cutoff);

      let released = 0;
      for (const reservation of stale ?? []) {
        const result = await ReservationService.release(
          reservation.id,
          'system',
          'Stale reservation — no payment activity'
        );
        if (result.success) released++;
      }

      return released;
    } catch {
      return 0;
    }
  },

  /**
   * Run a full reconciliation cycle.
   */
  async runFullCycle(): Promise<{
    ordersConfirmed: string[];
    staleReservationsReleased: number;
  }> {
    const [ordersConfirmed, staleReservationsReleased] = await Promise.all([
      this.findOrphanedPayments(),
      this.releaseStaleReservations(),
    ]);

    await recordEvent({
      domain: 'system',
      severity: 'info',
      action: 'reconciliation.cycle_complete',
      actorId: 'system',
      resourceType: 'system',
      resourceId: 'reconciliation',
      message: `Reconciliation cycle complete. ${ordersConfirmed.length} orders confirmed, ${staleReservationsReleased} stale reservations released.`,
      metadata: { ordersConfirmed, staleReservationsReleased },
    });

    return { ordersConfirmed, staleReservationsReleased };
  },
};
