import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';

/**
 * Validates Easebuzz Response Hash
 * Reverse hash format: salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
function verifyEasebuzzResponseHash(data: Record<string, string>, salt: string): boolean {
  const {
    key = '',
    txnid = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    udf1 = '',
    status = '',
    hash = '',
  } = data;

  const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  return calculatedHash.toLowerCase() === hash.toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((val, key) => {
      data[key] = val.toString();
    });

    const salt = process.env.EASEBUZZ_SALT;
    if (!salt) {
      return NextResponse.json({ error: 'Gateway misconfigured' }, { status: 500 });
    }

    const isValid = verifyEasebuzzResponseHash(data, salt);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid response signature' }, { status: 400 });
    }

    const admin = createAdminClient();
    const orderId = data.udf1;
    const status = data.status; // 'success' or 'failure'
    const txnid = data.txnid;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
    }

    if (status === 'success') {
      // Transition order to paid
      await admin
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'captured',
          payment_intent_id: txnid,
        })
        .eq('id', orderId);

      // Fulfill reservations
      await admin
        .from('inventory_reservations')
        .update({ reservation_state: 'fulfilled' })
        .eq('order_id', orderId);

      await recordEvent({
        domain: 'payment',
        severity: 'info',
        action: 'easebuzz.payment_success',
        actorId: 'system',
        resourceType: 'orders',
        resourceId: orderId,
        message: `Easebuzz payment successful for order ${orderId} (${txnid})`,
        metadata: { txnid, amount: data.amount },
      });

      // Redirect user to order confirmation success page
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';
      return NextResponse.redirect(`${baseUrl}/checkout/success?order_id=${orderId}`, 303);
    } else {
      await admin
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
        })
        .eq('id', orderId);

      await recordEvent({
        domain: 'payment',
        severity: 'warning',
        action: 'easebuzz.payment_failed',
        actorId: 'system',
        resourceType: 'orders',
        resourceId: orderId,
        message: `Easebuzz payment failed for order ${orderId} (${txnid})`,
        metadata: { txnid, error: data.error_Message || 'Payment failed' },
      });

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streetplayr.com';
      return NextResponse.redirect(`${baseUrl}/checkout?error=payment_failed`, 303);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Webhook processing failed' }, { status: 500 });
  }
}
