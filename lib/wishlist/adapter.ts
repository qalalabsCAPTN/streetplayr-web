/**
 * Wishlist storage adapter.
 * Backend (Supabase wishlists) when available; localStorage offline cache always.
 */

import type { WishlistItem } from '@/store/wishlistStore';

export interface WishlistAdapter {
  load(userId: string | null): Promise<WishlistItem[]>;
  add(userId: string, item: WishlistItem): Promise<void>;
  remove(userId: string, productId: string): Promise<void>;
}

const CACHE_KEY = (userId: string | null) =>
  userId ? `streetplayr-wishlist:${userId}` : 'streetplayr-wishlist:guest';

function readCache(userId: string | null): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(userId: string | null, items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY(userId), JSON.stringify(items));
  } catch {
    /* quota */
  }
}

function dedupe(items: WishlistItem[]): WishlistItem[] {
  const seen = new Set<string>();
  const out: WishlistItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function isSupabaseLive() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes('mockproject');
}

async function tryBackendLoad(userId: string): Promise<WishlistItem[] | null> {
  if (!isSupabaseLive()) return null;
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id, created_at, products(id, title, slug, featured_image_url, product_variants(price))')
      .eq('user_id', userId);

    if (error) {
      // table may not be migrated yet
      console.warn('[wishlist] backend load skipped:', error.message);
      return null;
    }

    return (data || []).map((row: any) => {
      const p = row.products;
      const prices = (p?.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
      return {
        id: p?.id || row.product_id,
        slug: p?.slug || '',
        name: p?.title || 'Product',
        price: prices.length ? Math.min(...prices) : 0,
        image: p?.featured_image_url || '',
        addedAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
      } satisfies WishlistItem;
    });
  } catch (err) {
    console.warn('[wishlist] backend load failed:', err);
    return null;
  }
}

async function tryBackendAdd(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseLive()) return false;
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { error } = await supabase
      .from('wishlists')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
    if (error) {
      console.warn('[wishlist] backend add skipped:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function tryBackendRemove(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseLive()) return false;
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) {
      console.warn('[wishlist] backend remove skipped:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const wishlistAdapter: WishlistAdapter = {
  async load(userId) {
    if (userId) {
      const remote = await tryBackendLoad(userId);
      if (remote) {
        writeCache(userId, remote);
        return dedupe(remote);
      }
    }
    return dedupe(readCache(userId));
  },

  async add(userId, item) {
    const cached = dedupe([item, ...readCache(userId)]);
    writeCache(userId, cached);
    await tryBackendAdd(userId, item.id);
  },

  async remove(userId, productId) {
    writeCache(
      userId,
      readCache(userId).filter((i) => i.id !== productId)
    );
    await tryBackendRemove(userId, productId);
  },
};
