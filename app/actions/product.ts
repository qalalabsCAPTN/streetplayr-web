'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { recordEvent } from '@/lib/orchestration/events';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';

type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createProductAction(data: {
  name: string;
  slug: string;
  price: number;
  description?: string;
  category_id?: string;
  is_active?: boolean;
}): Promise<ActionResponse> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const { data: product, error } = await admin
      .from('products')
      .insert({
        name: data.name,
        slug: data.slug,
        price: data.price,
        description: data.description ?? '',
        is_active: data.is_active ?? false,
        category_id: data.category_id ?? null,
      })
      .select('id, name, slug')
      .single();

    if (error) return { success: false, error: error.message };

    await recordEvent({
      domain: 'inventory',
      severity: 'info',
      action: 'product.created',
      actorId: auth.user.id,
      resourceType: 'products',
      resourceId: product.id,
      message: `Product created: ${product.name}`,
      metadata: { productId: product.id, slug: product.slug },
    });

    revalidatePath('/ops/products');
    return { success: true, data: product };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProductAction(
  id: string,
  data: {
    name?: string;
    price?: number;
    description?: string;
    status?: string;
    is_active?: boolean;
    slug?: string;
    category_id?: string;
  }
): Promise<ActionResponse> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const { data: product, error } = await admin
      .from('products')
      .update(data)
      .eq('id', id)
      .select('id, name, status, is_active')
      .single();

    if (error) return { success: false, error: error.message };

    await recordEvent({
      domain: 'inventory',
      severity: 'info',
      action: 'product.updated',
      actorId: auth.user.id,
      resourceType: 'products',
      resourceId: product.id,
      message: `Product updated: ${product.name}`,
      metadata: { productId: product.id, changes: Object.keys(data) },
    });

    revalidatePath('/ops/products');
    revalidatePath(`/ops/products/${id}`);
    return { success: true, data: product };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function toggleProductActiveAction(id: string, isActive: boolean): Promise<ActionResponse> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const { data: product, error } = await admin
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (error) return { success: false, error: error.message };

    await recordEvent({
      domain: 'inventory',
      severity: isActive ? 'info' : 'warning',
      action: isActive ? 'product.published' : 'product.unpublished',
      actorId: auth.user.id,
      resourceType: 'products',
      resourceId: product.id,
      message: isActive ? `Product published: ${product.name}` : `Product unpublished: ${product.name}`,
      metadata: { productId: product.id, isActive },
    });

    revalidatePath('/ops/products');
    revalidatePath(`/ops/products/${id}`);
    return { success: true, data: product };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateVariantStockAction(
  variantId: string,
  stockQuantity: number
): Promise<ActionResponse> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: auth.error.error };

  try {
    const admin = createAdminClient();
    const { data: variant, error } = await admin
      .from('product_variants')
      .update({ stock_quantity: stockQuantity })
      .eq('id', variantId)
      .select('id, product_id, size, color, stock_quantity')
      .single();

    if (error) return { success: false, error: error.message };

    await recordEvent({
      domain: 'inventory',
      severity: 'info',
      action: 'variant.stock_updated',
      actorId: auth.user.id,
      resourceType: 'product_variants',
      resourceId: variant.id,
      message: `Stock updated for ${variant.size}/${variant.color}: ${stockQuantity}`,
      metadata: { variantId: variant.id, productId: variant.product_id, stockQuantity },
    });

    revalidatePath(`/ops/products/${variant.product_id}`);
    return { success: true, data: variant };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
