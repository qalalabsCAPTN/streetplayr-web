'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';

export async function upsertVariantAction(data: {
  id?: string;
  product_id: string;
  color: string;
  size: string;
  stock_quantity: number;
  price_override?: number | null;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    if (data.id) {
      await admin.from('product_variants').update({
        color: data.color,
        size: data.size,
        stock_quantity: data.stock_quantity,
        price_override: data.price_override ?? null,
      }).eq('id', data.id);
      return { success: true, id: data.id };
    }
    const { data: variant } = await admin.from('product_variants').insert({
      product_id: data.product_id,
      color: data.color,
      size: data.size,
      stock_quantity: data.stock_quantity,
      price_override: data.price_override ?? null,
    }).select('id').single();
    return { success: true, id: variant?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteVariantAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    await admin.from('product_variants').delete().eq('id', id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProductStatusAction(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    await admin.from('products').update({ status }).eq('id', id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getProductEventsAction(productId: string) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('operational_events')
      .select('created_at, message, severity, action')
      .eq('resource_id', productId)
      .eq('resource_type', 'products')
      .order('created_at', { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}
