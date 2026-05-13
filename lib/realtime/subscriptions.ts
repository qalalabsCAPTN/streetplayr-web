import { createClient } from '@/lib/supabase/client';

/**
 * Realtime Subscriptions — selective listeners for high-heat data.
 */
export const RealtimeSubscriptions = {
  /**
   * Subscribes to wallet balance changes for a specific user.
   */
  subscribeToWallet(userId: string, onUpdate: (balance: number) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown> | null;
          if (data && typeof data.sprr_balance === 'number') {
            onUpdate(data.sprr_balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribes to stock updates for a specific product variant.
   * Returns a cleanup function.
   */
  subscribeToStock(variantId: string, onUpdate: (stock: number) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`stock:${variantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_variants',
          filter: `id=eq.${variantId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown> | null;
          if (data && typeof data.stock_quantity === 'number') {
            onUpdate(data.stock_quantity);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribes to order status changes for a specific order.
   * Useful for the checkout success page and order detail pages.
   */
  subscribeToOrderStatus(orderId: string, onUpdate: (status: string) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown> | null;
          if (data && typeof data.status === 'string') {
            onUpdate(data.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribes to inventory reservation changes for checkout-aware stock tracking.
   * Provides realtime visibility into reservation state changes.
   */
  subscribeToReservationChanges(orderId: string, onUpdate: (state: string) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`reservations:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_reservations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown> | null;
          if (data && typeof data.reservation_state === 'string') {
            onUpdate(data.reservation_state);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
