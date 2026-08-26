'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { resolveStorefrontBrandId } from '@/lib/products/brand';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';
import { assertEasebuzzLiveAllowed, getEasebuzzCredentials, initiatePayment } from '@/lib/easebuzz/client';
import { rateLimit } from '@/lib/security/rate-limit';

export interface EasebuzzInitiateParams {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface EasebuzzInitiateResult {
  accessKey: string;
  paymentUrl: string;
}

/**
 * Initiates an Easebuzz payment session for an order.
 *
 * SECURITY: the charged amount is always derived from the order row in the
 * DB (server-authoritative), never from client input — a tampered client
 * amount can never change what Easebuzz is asked to collect.
 */
export async function createEasebuzzPaymentAction(
  params: EasebuzzInitiateParams
): Promise<OrchestrationResponse<EasebuzzInitiateResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const rl = await rateLimit({ key: `easebuzz:${user.id}`, limit: 8, windowMs: 60_000 });
    if (!rl.ok) {
      return { success: false, error: 'Too many payment attempts. Wait a moment.', code: 'RATE_LIMITED' };
    }

    const creds = getEasebuzzCredentials();
    if (!creds) {
      return {
        success: false,
        error:
          'Easebuzz is not configured. Set EASEBUZZ_MERCHANT_KEY, EASEBUZZ_SALT, and EASEBUZZ_ENV=test or prod.',
        code: 'CONFIG_ERROR',
      };
    }

    const liveBlock = assertEasebuzzLiveAllowed(creds);
    if (liveBlock) {
      return { success: false, error: liveBlock, code: 'LIVE_CHARGING_BLOCKED' };
    }

    const admin = createAdminClient();
    const brandId = await resolveStorefrontBrandId(admin);
    const { data: customer } = user.email
      ? await admin.from('customers').select('id').eq('email', user.email).eq('brand_id', brandId).maybeSingle()
      : { data: null };

    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, grand_total, status, customer_id, notes')
      .eq('id', params.orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Order not found.', code: 'ORDER_NOT_FOUND' };
    }

    const isOwner =
      (customer && order.customer_id === customer.id) || order.notes === user.id;
    if (!isOwner) {
      return { success: false, error: 'Order does not belong to user.', code: 'UNAUTHORIZED_ORDER' };
    }

    if (order.status !== 'pending') {
      return {
        success: false,
        error: `Order is not payable in its current state (${order.status}).`,
        code: 'ORDER_NOT_PAYABLE',
      };
    }

    if (!order.grand_total || order.grand_total <= 0) {
      return { success: false, error: 'Order has no payable amount.', code: 'INVALID_AMOUNT' };
    }

    // Official txnid max length 40: /^[a-zA-Z0-9_|\-\/]{1,40}$/
    const rawTxn =
      `${(order.order_number || order.id.slice(0, 8)).replace(/[^a-zA-Z0-9_|/-]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
    const txnid = rawTxn.slice(0, 40);
    const amountStr = Number(order.grand_total).toFixed(2);
    if (Number.parseFloat(amountStr) < 1) {
      return {
        success: false,
        error: 'Easebuzz requires amount >= 1.00 INR.',
        code: 'INVALID_AMOUNT',
      };
    }
    const productInfo = 'StreetplayR Order';
    const udf1 = order.id;
    const firstname = (params.customerName || 'Customer').trim().split(' ')[0] || 'Customer';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';
    const surl = `${baseUrl}/api/webhooks/easebuzz`;
    const furl = `${baseUrl}/api/webhooks/easebuzz`;

    const result = await initiatePayment(creds, {
      txnid,
      amount: amountStr,
      productinfo: productInfo,
      firstname,
      email: params.customerEmail,
      phone: params.customerPhone,
      surl,
      furl,
      udf1,
    });

    if (!result.success) {
      await recordEvent({
        domain: 'payment',
        severity: 'warning',
        action: result.error.includes('timeout') || result.error.includes('unreachable')
          ? 'easebuzz.gateway_unreachable'
          : 'easebuzz.initiation_rejected',
        actorId: user.id,
        resourceType: 'orders',
        resourceId: params.orderId,
        message: `Easebuzz payment initiation failed for order ${params.orderId}`,
        metadata: { txnid, reason: result.error },
      });
      return {
        success: false,
        error:
          result.error.includes('timeout') || result.error.includes('unreachable')
            ? 'Payment gateway is temporarily unavailable. Please try again.'
            : result.error || 'Failed to initiate Easebuzz payment session.',
        code: result.error.includes('timeout') || result.error.includes('unreachable')
          ? 'GATEWAY_UNAVAILABLE'
          : 'EASEBUZZ_INIT_FAILED',
      };
    }

    await admin
      .from('orders')
      .update({ payment_intent_id: txnid })
      .eq('id', params.orderId);

    await recordEvent({
      domain: 'payment',
      severity: 'info',
      action: 'easebuzz.payment_initiated',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: params.orderId,
      message: `Easebuzz payment session initiated for order ${params.orderId}`,
      metadata: { txnid, amount: order.grand_total },
    });

    return { success: true, data: result.data };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Easebuzz initialization error';
    return { success: false, error: message, code: 'EASEBUZZ_ERROR' };
  }
}
