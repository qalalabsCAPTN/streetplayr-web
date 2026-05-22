'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getAvailableInventory } from '@/lib/inventory';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

const DEMO_MODE = process.env.DEMO_INVENTORY_MODE === 'true';
const ORG_ID = '00000000-0000-0000-0000-000000000001';
const BRAND_ID = 'e56b72a5-3746-4c01-a054-885ed3e55c0f';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingCost?: number;
  taxAmount?: number;
}

export interface CheckoutResult {
  orderId: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  reservationIds: string[];
}

async function resolveCustomerId(admin: any, userId: string, email?: string): Promise<string | null> {
  if (!email) return null;

  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) return existing.id;

  const profile = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  const name = profile?.full_name?.split(' ') ?? ['', ''];
  const { data: created } = await admin
    .from('customers')
    .insert({
      organization_id: ORG_ID,
      brand_id: BRAND_ID,
      email,
      first_name: name[0] ?? '',
      last_name: name.slice(1).join(' ') ?? '',
    })
    .select('id')
    .single();

  return created?.id ?? null;
}

export async function initiateCheckoutAction(
  items: CheckoutItem[],
  shippingAddress: CheckoutAddress,
  paymentIntentId?: string
): Promise<OrchestrationResponse<CheckoutResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    if (!items.length) {
      return { success: false, error: 'Cart is empty.', code: 'EMPTY_CART' };
    }

    const admin = createAdminClient();
    let usedSupabaseFallback = false;

    for (const item of items) {
      const { data: variant } = await admin
        .from('product_variants')
        .select('price, product_id')
        .eq('id', item.variantId)
        .single();

      if (!variant) {
        if (DEMO_MODE) {
          usedSupabaseFallback = true;
          const available = await getAvailableInventory(item.variantId);
          if (available < item.quantity) {
            return { success: false, error: `Insufficient stock for variant ${item.variantId}.`, code: 'INSUFFICIENT_STOCK' };
          }
          continue;
        }
        return { success: false, error: `Variant ${item.variantId} not found.`, code: 'VARIANT_NOT_FOUND' };
      }

      const available = await getAvailableInventory(item.variantId);
      if (available < item.quantity) {
        return { success: false, error: `Insufficient stock for variant ${item.variantId}.`, code: 'INSUFFICIENT_STOCK' };
      }

      if (item.price !== variant.price) {
        return {
          success: false,
          error: `Price mismatch for variant ${item.variantId}: expected ${variant.price}, got ${item.price}`,
          code: 'PRICE_MISMATCH',
        };
      }
    }

    const addressWithMeta = {
      ...shippingAddress,
      shipping_cost: shippingAddress.shippingCost ?? 0,
      tax_amount: shippingAddress.taxAmount ?? 0,
    };

    const customerId = await resolveCustomerId(admin, user.id, user.email);
    if (!customerId) {
      return { success: false, error: 'Could not resolve customer record.', code: 'CUSTOMER_NOT_FOUND' };
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = shippingAddress.shippingCost ?? 0;
    const tax = shippingAddress.taxAmount ?? 0;
    const grandTotal = subtotal + shipping + tax;
    const orderNumber = `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        organization_id: ORG_ID,
        brand_id: BRAND_ID,
        order_number: orderNumber,
        customer_id: customerId,
        status: 'pending',
        fulfillment_status: 'unfulfilled',
        payment_status: 'pending',
        subtotal,
        shipping_total: shipping,
        tax_total: tax,
        discount_total: 0,
        grand_total: grandTotal,
        currency: 'INR',
        source: 'streetplayr',
        shipping_address: addressWithMeta as Record<string, unknown>,
        notes: user.id,
      })
      .select('id, order_number, status, grand_total, subtotal, shipping_total, tax_total, created_at')
      .single();

    if (orderError) {
      return { success: false, error: orderError.message, code: 'ORDER_CREATE_FAILED' };
    }

    const orderItemRows: any[] = [];
    for (const item of items) {
      if (UUID_RE.test(item.productId) && UUID_RE.test(item.variantId)) {
        const { data: pv } = await admin
          .from('product_variants')
          .select('sku, title, product_id, product:products(title)')
          .eq('id', item.variantId)
          .single();

        const productArr = pv?.product as { title?: string }[] | undefined;
        orderItemRows.push({
          order_id: order.id,
          variant_id: item.variantId,
          product_id: item.productId,
          product_title: productArr?.[0]?.title ?? item.productId,
          variant_title: pv?.title ?? item.variantId,
          sku: pv?.sku ?? null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        });
      } else if (usedSupabaseFallback) {
        const { data: pv } = await admin
          .from('product_variants')
          .select('id, sku, title, product_id, product:products(title)')
          .eq('product_id', item.productId)
          .maybeSingle();

        if (pv && UUID_RE.test(pv.product_id)) {
          const fbProductArr = pv.product as { title?: string }[] | undefined;
          orderItemRows.push({
            order_id: order.id,
            product_id: pv.product_id,
            variant_id: pv.id,
            product_title: fbProductArr?.[0]?.title ?? item.variantId,
            variant_title: pv.title ?? item.variantId,
            sku: pv.sku ?? null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          });
        }
      }
    }

    if (orderItemRows.length > 0) {
      const { error: oiError } = await admin.from('order_items').insert(orderItemRows);
      if (oiError) {
        return { success: false, error: oiError.message, code: 'ORDER_ITEMS_FAILED' };
      }
    }

    const checkoutResult: CheckoutResult = {
      orderId: order.id,
      status: 'pending',
      total: grandTotal,
      subtotal,
      shippingCost: shipping,
      taxAmount: tax,
      reservationIds: [],
    };

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'checkout.initiated',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: checkoutResult.orderId,
      message: `Checkout initiated — ${checkoutResult.total} INR, ${items.length} items`,
      metadata: {
        itemCount: items.length,
        total: checkoutResult.total,
        hasPaymentIntent: !!paymentIntentId,
      },
    });

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'cart.checked_out',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: checkoutResult.orderId,
      message: `Cart checked out — ${items.length} items, ${checkoutResult.total} INR`,
      metadata: {
        itemCount: items.length,
        orderTotal: checkoutResult.total,
        orderId: checkoutResult.orderId,
      },
    });

    return { success: true, data: checkoutResult };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'CHECKOUT_ACTION_ERROR' };
  }
}
