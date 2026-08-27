'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';
import { ReservationService } from '@/lib/orchestration/reservation';
import { OrderService } from '@/lib/orchestration/order';
import { resolveStorefrontBrandId } from '@/lib/products/brand';
import { maxRedeemableCredits } from '@/lib/loyalty/redemption';
import { isRemovedApparelSize } from '@/lib/products/sizes';
import {
  assertShippableAddress,
  normalizeGstin,
  toAddressSnapshot,
  type CanonicalAddress,
} from '@/lib/commerce/address';
import { orderInsertMoney, quoteTotals, type TotalsResult } from '@/lib/commerce/totals';
import { generateOrderNumber } from '@/lib/commerce/order-number';
import { quoteCoupon, recordCouponRedemption } from '@/lib/commerce/coupons';
import { rateLimit } from '@/lib/security/rate-limit';

const DEMO_MODE = process.env.DEMO_INVENTORY_MODE === 'true';
const ORG_ID = '00000000-0000-0000-0000-000000000001';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CheckoutAddress {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  gstin?: string;
  /** Ignored. Server quotes shipping. */
  shippingCost?: number;
  /** Ignored. Server quotes tax. */
  taxAmount?: number;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountTotal: number;
  reservationIds: string[];
}

async function resolveCustomerId(admin: ReturnType<typeof createAdminClient>, userId: string, email?: string): Promise<string | null> {
  if (!email) return null;

  const brandId = await resolveStorefrontBrandId(admin);
  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('email', email)
    .eq('brand_id', brandId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  const name = profile?.full_name?.split(' ') ?? ['', ''];
  const { data: created } = await admin
    .from('customers')
    .insert({
      organization_id: ORG_ID,
      brand_id: brandId,
      email,
      first_name: name[0] ?? '',
      last_name: name.slice(1).join(' ') ?? '',
    })
    .select('id')
    .single();

  return created?.id ?? null;
}

function toCanonical(address: CheckoutAddress, email: string, name: string): CanonicalAddress {
  return {
    name: address.name || name,
    line1: address.line1,
    line2: address.line2 || '',
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: (address.country || 'IN').toUpperCase(),
    phone: address.phone || '',
    email: address.email || email,
    gstin: normalizeGstin(address.gstin),
  };
}

export async function quoteCheckoutAction(params: {
  items: CheckoutItem[];
  country: string;
  state?: string;
  gstin?: string;
  creditsToApply?: number;
  couponCode?: string;
}): Promise<OrchestrationResponse<TotalsResult & { couponDiscount: number; creditsApplied: number }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();
    const brandId = await resolveStorefrontBrandId(admin);
    let subtotal = 0;
    for (const item of params.items) {
      const { data: owned } = await admin
        .from('product_variants')
        .select('price, products!inner(brand_id)')
        .eq('id', item.variantId)
        .eq('products.brand_id', brandId)
        .maybeSingle();
      if (!owned) {
        return { success: false, error: 'This item is not sold on StreetPlayR.', code: 'FOREIGN_BRAND' };
      }
      const unit = Number(owned.price ?? item.price);
      subtotal += unit * item.quantity;
    }

    let couponDiscount = 0;
    if (params.couponCode) {
      const quoted = await quoteCoupon({ code: params.couponCode, subtotal, userId: user.id });
      if (quoted.ok) couponDiscount = quoted.data.discount;
    }

    const { data: walletProfile } = await admin
      .from('profiles')
      .select('sprr_balance')
      .eq('id', user.id)
      .maybeSingle();
    const balance = typeof walletProfile?.sprr_balance === 'number' ? walletProfile.sprr_balance : 0;
    const afterCoupon = Math.max(0, subtotal - couponDiscount);
    const creditsApplied = Math.min(
      Math.max(0, Math.floor(params.creditsToApply ?? 0)),
      maxRedeemableCredits(balance, afterCoupon)
    );

    const totals = quoteTotals({
      subtotal,
      discount: couponDiscount + creditsApplied,
      country: params.country,
      state: params.state,
      gstin: normalizeGstin(params.gstin),
    });

    return { success: true, data: { ...totals, couponDiscount, creditsApplied } };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Quote failed', code: 'QUOTE_FAILED' };
  }
}

export async function initiateCheckoutAction(
  items: CheckoutItem[],
  shippingAddress: CheckoutAddress,
  paymentIntentId?: string,
  creditsToApply = 0,
  couponCode?: string
): Promise<OrchestrationResponse<CheckoutResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const rl = await rateLimit({ key: `checkout:${user.id}`, limit: 8, windowMs: 60_000 });
    if (!rl.ok) {
      return { success: false, error: 'Too many checkout attempts. Wait a moment.', code: 'RATE_LIMITED' };
    }

    if (!items.length) {
      return { success: false, error: 'Cart is empty.', code: 'EMPTY_CART' };
    }

    const admin = createAdminClient();
    const brandId = await resolveStorefrontBrandId(admin);
    const canonical = toCanonical(
      shippingAddress,
      user.email || '',
      shippingAddress.name || user.email || 'Customer'
    );
    const addressError = assertShippableAddress(canonical);
    if (addressError) return { success: false, error: addressError, code: 'INVALID_ADDRESS' };

    const priced: Array<CheckoutItem & { sku: string | null; title: string; productTitle: string }> = [];
    for (const item of items) {
      if (!UUID_RE.test(item.variantId)) {
        return { success: false, error: `Invalid variant ${item.variantId}`, code: 'VARIANT_NOT_FOUND' };
      }
      const { data: variant } = await admin
        .from('product_variants')
        .select('price, product_id, title, sku, attributes')
        .eq('id', item.variantId)
        .maybeSingle();

      if (!variant) {
        if (DEMO_MODE) continue;
        return { success: false, error: `Variant ${item.variantId} not found.`, code: 'VARIANT_NOT_FOUND' };
      }

      const sizeLabel =
        (variant.attributes as { size?: string } | null)?.size || variant.title || '';
      if (isRemovedApparelSize(sizeLabel)) {
        return { success: false, error: 'Selected size is not available.', code: 'SIZE_UNAVAILABLE' };
      }

      const unit = Number(variant.price);
      if (item.price !== unit) {
        return {
          success: false,
          error: `Price mismatch for variant ${item.variantId}: expected ${unit}, got ${item.price}`,
          code: 'PRICE_MISMATCH',
        };
      }

      const { data: product } = await admin
        .from('products')
        .select('title, brand_id')
        .eq('id', variant.product_id)
        .eq('brand_id', brandId)
        .maybeSingle();

      if (!product) {
        return { success: false, error: 'This item is not sold on StreetPlayR.', code: 'FOREIGN_BRAND' };
      }

      priced.push({
        ...item,
        productId: variant.product_id,
        price: unit,
        sku: variant.sku ?? null,
        title: variant.title ?? item.variantId,
        productTitle: product?.title ?? item.productId,
      });
    }

    if (!priced.length) {
      return { success: false, error: 'No payable items.', code: 'EMPTY_CART' };
    }

    const subtotal = priced.reduce((sum, i) => sum + i.price * i.quantity, 0);

    let couponDiscount = 0;
    let couponId: string | null = null;
    let couponLabel: string | null = null;
    if (couponCode) {
      const quoted = await quoteCoupon({ code: couponCode, subtotal, userId: user.id });
      if (!quoted.ok) return { success: false, error: quoted.error, code: 'COUPON_INVALID' };
      couponDiscount = quoted.data.discount;
      couponId = quoted.data.couponId;
      couponLabel = quoted.data.code;
    }

    const { data: walletProfile } = await admin
      .from('profiles')
      .select('sprr_balance')
      .eq('id', user.id)
      .maybeSingle();
    const balance = typeof walletProfile?.sprr_balance === 'number' ? walletProfile.sprr_balance : 0;
    const afterCoupon = Math.max(0, subtotal - couponDiscount);
    const creditsApplied = Math.min(
      Math.max(0, Math.floor(creditsToApply)),
      maxRedeemableCredits(balance, afterCoupon)
    );

    const totals = quoteTotals({
      subtotal,
      discount: couponDiscount + creditsApplied,
      country: canonical.country,
      state: canonical.state,
      gstin: canonical.gstin,
    });

    if (totals.grandTotal < 1) {
      return { success: false, error: 'Payable amount must be at least ₹1.', code: 'INVALID_AMOUNT' };
    }

    const customerId = await resolveCustomerId(admin, user.id, user.email);
    if (!customerId) {
      return { success: false, error: 'Could not resolve customer record.', code: 'CUSTOMER_NOT_FOUND' };
    }

    const orderNumber = generateOrderNumber();
    const snapshot = toAddressSnapshot(canonical);

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        organization_id: ORG_ID,
        brand_id: brandId,
        order_number: orderNumber,
        customer_id: customerId,
        status: 'pending',
        fulfillment_status: 'unfulfilled',
        payment_status: 'pending',
        ...orderInsertMoney({
          ...totals,
          discount: couponDiscount + creditsApplied,
        }),
        currency: 'INR',
        source: 'streetplayr',
        shipping_address: {
          ...snapshot,
          coupon_code: couponLabel ?? '',
          credits_applied: String(creditsApplied),
        },
        billing_address: snapshot,
        notes: user.id,
      })
      .select('id, order_number, status, grand_total, subtotal, shipping_total, tax_total, discount_total')
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message ?? 'Order create failed', code: 'ORDER_CREATE_FAILED' };
    }

    const { error: oiError } = await admin.from('order_items').insert(
      priced.map((item) => ({
        order_id: order.id,
        variant_id: item.variantId,
        product_id: item.productId,
        product_title: item.productTitle,
        variant_title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))
    );

    if (oiError) {
      await OrderService.cancel(order.id, user.id, 'order_items_failed');
      return { success: false, error: oiError.message, code: 'ORDER_ITEMS_FAILED' };
    }

    const reservationIds: string[] = [];
    for (const item of priced) {
      const reserved = await ReservationService.create(
        item.variantId,
        item.productId,
        item.quantity,
        user.id,
        'checkout_enter',
        15,
        order.id
      );
      if (!reserved.success || !reserved.data) {
        await ReservationService.releaseAllForOrder(order.id, user.id, 'checkout_stock_race');
        await OrderService.cancel(order.id, user.id, 'insufficient_stock');
        return {
          success: false,
          error: reserved.error ?? `Insufficient stock for ${item.variantId}`,
          code: 'INSUFFICIENT_STOCK',
        };
      }
      reservationIds.push(reserved.data.id);
    }

    if (couponId) {
      await recordCouponRedemption({
        couponId,
        userId: user.id,
        orderId: order.id,
        amount: couponDiscount,
      });
    }

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'checkout.initiated',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: order.id,
      message: `Checkout ${orderNumber} — ${totals.grandTotal} INR, ${priced.length} items, ${reservationIds.length} holds`,
      metadata: {
        itemCount: priced.length,
        total: totals.grandTotal,
        reservationIds,
        hasPaymentIntent: !!paymentIntentId,
      },
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'pending',
        total: totals.grandTotal,
        subtotal,
        shippingCost: totals.shipping,
        taxAmount: totals.tax,
        discountTotal: couponDiscount + creditsApplied,
        reservationIds,
      },
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Checkout failed',
      code: 'CHECKOUT_ACTION_ERROR',
    };
  }
}
