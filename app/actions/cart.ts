'use server';

import { CartService } from '@/lib/commerce/cart';
import { createClient } from '@/lib/supabase/server';
import { CartItem } from '@/store/cartStore';

/**
 * Server Action: Sync Cart Checkpoint
 */
export async function syncCartAction(items: CartItem[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    await CartService.syncCart(user.id, items);
    return { success: true };
  } catch (e) {
    console.error('syncCartAction error:', e);
    return { success: false, error: 'Cart sync failed' };
  }
}

/**
 * Server Action: Pull Cart
 */
export async function pullCartAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    return await CartService.getCart(user.id);
  } catch (e) {
    console.error('pullCartAction error:', e);
    return [];
  }
}
