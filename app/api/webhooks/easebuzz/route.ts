import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import { PaymentService } from '@/lib/orchestration/payment';
import {
  mapEasebuzzStatus,
  verifyResponseHash,
} from '@/lib/easebuzz/client';

// Re-export for tests that import from the route module.
export { mapEasebuzzStatus, verifyResponseHash as verifyEasebuzzResponseHash };

/**
 * Easebuzz Webhook Ingestion Handler
 *
 * Receives the Easebuzz success/failure callback (surl/furl), verifies the
 * reverse hash, then routes into PaymentService — the same state-machine
 * entry point every gateway adapter uses.
 */

const REDIRECT_TARGET: Record<'success' | 'failed' | 'pending', (baseUrl: string, orderId: string) => string> = {
  success: (baseUrl, orderId) => `${baseUrl}/checkout/success?order_id=${orderId}`,
  failed: (baseUrl, orderId) => `${baseUrl}/checkout?error=payment_failed&order_id=${orderId}`,
  pending: (baseUrl, orderId) => `${baseUrl}/checkout?pending=1&order_id=${orderId}`,
};

function parseCallbackData(req: Request, formData?: FormData): Record<string, string> {
  const data: Record<string, string> = {};

  if (formData) {
    formData.forEach((val, key) => {
      data[key] = val.toString();
    });
    return data;
  }

  const url = new URL(req.url);
  url.searchParams.forEach((val, key) => {
    data[key] = val;
  });
  return data;
}

async function handleEasebuzzCallback(data: Record<string, string>): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';

  const salt = process.env.EASEBUZZ_SALT;
  if (!salt) {
    console.error('[Easebuzz Webhook] EASEBUZZ_SALT not configured — rejecting callback');
    return NextResponse.json({ error: 'Gateway misconfigured' }, { status: 500 });
  }

  if (!verifyResponseHash(data, salt)) {
    await recordEvent({
      domain: 'payment',
      severity: 'critical',
      action: 'easebuzz.invalid_signature',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: data.udf1 || 'unknown',
      message: 'Easebuzz webhook signature verification failed — possible spoofed callback',
      metadata: { txnid: data.txnid ?? null },
    });
    return NextResponse.json({ error: 'Invalid response signature' }, { status: 400 });
  }

  const admin = createAdminClient();
  const txnid = data.txnid;
  const orderIdFromUdf = data.udf1;

  if (!txnid) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
  }

  const { data: order } = await admin
    .from('orders')
    .select('id, grand_total, status')
    .eq('payment_intent_id', txnid)
    .maybeSingle();

  if (!order) {
    await recordEvent({
      domain: 'payment',
      severity: 'warning',
      action: 'easebuzz.unknown_transaction',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: orderIdFromUdf || 'unknown',
      message: `No order found for Easebuzz txnid ${txnid}`,
      metadata: { txnid },
    });
    return NextResponse.json({ received: true, orderFound: false });
  }

  if (orderIdFromUdf && orderIdFromUdf !== order.id) {
    await recordEvent({
      domain: 'payment',
      severity: 'critical',
      action: 'easebuzz.udf1_order_mismatch',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: order.id,
      message: `Easebuzz callback udf1 (${orderIdFromUdf}) does not match order resolved from txnid (${order.id})`,
      metadata: { txnid },
    });
    return NextResponse.json({ error: 'Order reference mismatch' }, { status: 400 });
  }

  const eventType = mapEasebuzzStatus(data.status);
  const callbackAmount = Number.parseFloat(data.amount || '0');
  const expectedAmount = Number(order.grand_total || 0);
  const amountMatches = Number.isFinite(callbackAmount) && Math.abs(callbackAmount - expectedAmount) < 0.01;

  if (eventType === 'payment_intent.succeeded' && !amountMatches) {
    await recordEvent({
      domain: 'payment',
      severity: 'critical',
      action: 'easebuzz.amount_mismatch',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: order.id,
      message: `Easebuzz reported success with amount ${callbackAmount} but order expects ${expectedAmount} — order NOT confirmed, needs manual review`,
      metadata: { txnid, callbackAmount, expectedAmount },
    });

    return NextResponse.redirect(REDIRECT_TARGET.failed(baseUrl, order.id), 303);
  }

  const result = await PaymentService.processWebhookEvent({
    eventType,
    provider: 'easebuzz',
    providerEventId: `easebuzz:${txnid}:${eventType}`,
    providerTransactionId: txnid,
    amount: Math.round(expectedAmount * 100),
    currency: 'inr',
    rawPayload: {
      status: data.status,
      txnid,
      amount: data.amount,
      mode: data.mode,
    },
  });

  if (!result.success && result.code && result.code !== 'ORDER_NOT_FOUND') {
    console.error('[Easebuzz Webhook] processing failed:', result.error);
    return NextResponse.redirect(REDIRECT_TARGET.failed(baseUrl, order.id), 303);
  }

  if (eventType === 'payment_intent.succeeded') {
    return NextResponse.redirect(REDIRECT_TARGET.success(baseUrl, order.id), 303);
  }

  if (eventType === 'payment_intent.processing') {
    return NextResponse.redirect(REDIRECT_TARGET.pending(baseUrl, order.id), 303);
  }

  return NextResponse.redirect(REDIRECT_TARGET.failed(baseUrl, order.id), 303);
}

/** Browser redirect callback — Easebuzz POSTs form-urlencoded body to surl/furl. */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    return handleEasebuzzCallback(parseCallbackData(req, formData));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    console.error('[Easebuzz Webhook] Error processing webhook:', message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/** Fallback for gateways that redirect with query parameters instead of form POST. */
export async function GET(req: Request) {
  try {
    return handleEasebuzzCallback(parseCallbackData(req));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    console.error('[Easebuzz Webhook] Error processing GET callback:', message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
