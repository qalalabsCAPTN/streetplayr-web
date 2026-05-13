'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function toggleCollectionStatusAction(
  collectionId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    await admin.from('collections').update({ is_active: isActive }).eq('id', collectionId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function linkProductToCollectionAction(
  collectionId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    await admin.from('collection_products').insert({ collection_id: collectionId, product_id: productId });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function unlinkProductFromCollectionAction(
  collectionId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    await admin
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
