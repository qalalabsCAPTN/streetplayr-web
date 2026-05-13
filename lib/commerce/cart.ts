import { createClient } from '@/lib/supabase/server';
import { CartItem } from '@/store/cartStore';

/**
 * Cart Domain Logic — checkpoint-based syncing.
 */
export const CartService = {
  /**
   * Syncs the local cart to the database.
   * This is a "checkpoint" operation, not a per-keystroke sync.
   */
  async syncCart(userId: string, items: CartItem[]) {
    try {
      const supabase = await createClient();

      // Deduplicate items before sync to ensure DB integrity
      const uniqueItems = items.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          x.quantity += current.quantity;
          return acc;
        }
      }, [] as CartItem[]);

      // Replace DB state with the latest "checkpoint" from client
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (uniqueItems.length > 0) {
        const toInsert = uniqueItems.map(item => ({
          user_id: userId,
          product_id: item.productId,
          variant_id: item.id, // Uses actual variant UUID (set at add-to-cart time)
          quantity: item.quantity,
          metadata: {
            color: item.color,
            size: item.size,
            name: item.name,
            price: item.price,
            image: item.image,
            variantId: item.id,
          }
        }));

        const { error } = await supabase
          .from('cart_items')
          .insert(toInsert);
          
        if (error) throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Cart sync error:', error);
      return { success: false, error };
    }
  },

  /**
   * Pulls the cart from DB (e.g. after login).
   */
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];

      return data.map(item => ({
        id: item.metadata?.variantId || `${item.product_id}-${item.metadata.color}-${item.metadata.size}`,
        productId: item.product_id,
        name: item.metadata.name,
        price: item.metadata.price,
        quantity: item.quantity,
        color: item.metadata.color,
        size: item.metadata.size,
        image: item.metadata.image,
      }));
    } catch (e) {
      console.error('CartService.getCart error:', e);
      return [];
    }
  }
};
