import { createClient } from '@/lib/supabase/server';

/**
 * Wallet Service — domain logic for SP-RR economy.
 */
export const WalletService = {
  /**
   * Fetches the current user's balance and recent transactions.
   */
  async getWalletData(userId: string) {
    try {
      const supabase = await createClient();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('sprr_balance')
        .eq('id', userId)
        .single();

      const { data: transactions, error: txError } = await supabase
        .from('wallet_transactions')
        .select('id, type, source, delta, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        balance: profile?.sprr_balance || 0,
        transactions: transactions || [],
        error: profileError || txError,
      };
    } catch (e) {
      console.error('WalletService.getWalletData error:', e);
      return { balance: 0, transactions: [], error: e };
    }
  }
};
