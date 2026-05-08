import { createClient } from '@/lib/supabase/client';
import { createStubClient } from '@/lib/supabase/stub';

function safeClient(): ReturnType<typeof createClient> {
  try {
    return createClient();
  } catch {
    return createStubClient('realtime');
  }
}

/**
 * Realtime Subscriptions — selective listeners for high-heat data.
 */
export const RealtimeSubscriptions = {
  /**
   * Subscribes to wallet balance changes for a specific user.
   */
  subscribeToWallet(userId: string, onUpdate: (balance: number) => void) {
    const supabase = safeClient();

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
   */
  subscribeToStock(variantId: string, onUpdate: (stock: number) => void) {
    const supabase = safeClient();

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
  }
};
