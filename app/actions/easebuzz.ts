'use server';

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

export interface EasebuzzInitiateParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface EasebuzzInitiateResult {
  accessKey: string;
  paymentUrl: string;
}

/**
 * Generates SHA-512 Hash for Easebuzz API initiation
 * Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
 */
function generateEasebuzzHash(
  key: string,
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  udf1: string,
  salt: string
): string {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Initiates Easebuzz payment session for an order
 */
export async function createEasebuzzPaymentAction(
  params: EasebuzzInitiateParams
): Promise<OrchestrationResponse<EasebuzzInitiateResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const merchantKey = process.env.EASEBUZZ_MERCHANT_KEY;
    const salt = process.env.EASEBUZZ_SALT;
    const env = process.env.EASEBUZZ_ENV || 'test'; // 'test' or 'prod'

    if (!merchantKey || !salt) {
      return {
        success: false,
        error: 'Easebuzz payment gateway is not configured. Missing EASEBUZZ_MERCHANT_KEY or EASEBUZZ_SALT.',
        code: 'CONFIG_ERROR',
      };
    }

    const admin = createAdminClient();

    // Verify order
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, grand_total, status')
      .eq('id', params.orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Order not found.', code: 'ORDER_NOT_FOUND' };
    }

    const txnid = order.order_number || `TXN-${Date.now()}`;
    const amountStr = params.amount.toFixed(2);
    const productInfo = 'Streetplayr Order';
    const udf1 = params.orderId;
    const firstname = params.customerName.split(' ')[0] || 'Customer';

    const hash = generateEasebuzzHash(
      merchantKey,
      txnid,
      amountStr,
      productInfo,
      firstname,
      params.customerEmail,
      udf1,
      salt
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';
    const surl = `${baseUrl}/api/webhooks/easebuzz`;
    const furl = `${baseUrl}/checkout?error=payment_failed`;

    const easebuzzHost = env === 'prod' 
      ? 'https://pay.easebuzz.in' 
      : 'https://testpay.easebuzz.in';

    const payload = new URLSearchParams({
      key: merchantKey,
      txnid,
      amount: amountStr,
      productinfo: productInfo,
      firstname,
      email: params.customerEmail,
      phone: params.customerPhone,
      surl,
      furl,
      hash,
      udf1,
    });

    const response = await fetch(`${easebuzzHost}/payment/initiateLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const data = await response.json();

    if (data.status !== 1 || !data.data) {
      return {
        success: false,
        error: data.error_desc || 'Failed to initiate Easebuzz payment session.',
        code: 'EASEBUZZ_INIT_FAILED',
      };
    }

    // Link transaction ID to order
    await admin
      .from('orders')
      .update({
        payment_intent_id: txnid,
        status: 'pending_payment',
      })
      .eq('id', params.orderId);

    await recordEvent({
      domain: 'payment',
      severity: 'info',
      action: 'easebuzz.payment_initiated',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: params.orderId,
      message: `Easebuzz payment session initiated for order ${params.orderId}`,
      metadata: { txnid, amount: params.amount },
    });

    return {
      success: true,
      data: {
        accessKey: data.data,
        paymentUrl: `${easebuzzHost}/pay/${data.data}`,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Easebuzz initialization error', code: 'EASEBUZZ_ERROR' };
  }
}
