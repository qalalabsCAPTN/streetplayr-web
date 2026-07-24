'use server';

import { CartService } from '@/lib/commerce/cart';
import { createClient } from '@/lib/supabase/server';
import { CartItem } from '@/store/cartStore';

/**
 * Server Action: Sync Cart Checkpoint
 * Guests keep Zustand-only cart — soft skip, never throw.
 */
export async function syncCartAction(items: CartItem[]) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, skipped: true, reason: 'guest' as const };
    }

    const result = await CartService.syncCart(user.id, items, user.email);
    return {
      success: result.success,
      skipped: result.skipped,
      reason: result.reason,
      schema: result.schema,
    };
  } catch (e) {
    console.error('syncCartAction error (soft):', e);
    return { success: true, skipped: true, reason: 'exception' as const };
  }
}

/**
 * Server Action: Pull Cart
 */
export async function pullCartAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    return await CartService.getCart(user.id, user.email);
  } catch (e) {
    console.error('pullCartAction error:', e);
    return [];
  }
}
