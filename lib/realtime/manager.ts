import { RealtimeSubscriptions } from './subscriptions';
import { useAuthStore } from '@/store/authStore';

/**
 * Realtime Manager — centralizes subscription lifecycles.
 * Logic is decoupled from UI components.
 */
export const RealtimeManager = {
  /**
   * Initializes global subscriptions (e.g. Wallet).
   * Returns a cleanup function.
   */
  initGlobal(userId: string, syncFn: (updates: any) => void) {
    console.log(`[Realtime] Initializing global manager for ${userId}`);
    
    const unsubscribeWallet = RealtimeSubscriptions.subscribeToWallet(
      userId, 
      (newBalance) => {
        syncFn({ sprrBalance: newBalance });
      }
    );

    return () => {
      console.log(`[Realtime] Cleaning up global manager`);
      unsubscribeWallet();
    };
  }
};
