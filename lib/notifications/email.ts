import { recordEvent } from '@/lib/orchestration/events';
import { reportError } from '@/lib/monitoring/report';

export type TransactionalTemplate =
  | 'order_confirmation'
  | 'payment_success'
  | 'payment_failure'
  | 'shipment'
  | 'delivery'
  | 'cancellation'
  | 'refund'
  | 'return_update'
  | 'contact_ack';

const SUBJECT: Record<TransactionalTemplate, string> = {
  order_confirmation: 'Your StreetPlayR order is confirmed',
  payment_success: 'Payment received — StreetPlayR',
  payment_failure: 'Payment failed — StreetPlayR',
  shipment: 'Your StreetPlayR order has shipped',
  delivery: 'Your StreetPlayR order was delivered',
  cancellation: 'Your StreetPlayR order was cancelled',
  refund: 'Refund processed — StreetPlayR',
  return_update: 'Return / exchange update — StreetPlayR',
  contact_ack: 'We received your message — StreetPlayR',
};

export async function sendTransactionalEmail(params: {
  to: string;
  template: TransactionalTemplate;
  html: string;
  text: string;
  orderId?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.TRANSACTIONAL_FROM_EMAIL || 'StreetPlayR <orders@playR.in>';

  if (!key) {
    await recordEvent({
      domain: 'system',
      severity: 'warning',
      action: 'notify.email_not_configured',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: params.orderId || 'none',
      message: `Skipped ${params.template} email to ${params.to} — RESEND_API_KEY missing`,
      metadata: { template: params.template },
    });
    return { sent: false, error: 'Email delivery is not configured (RESEND_API_KEY).' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: SUBJECT[params.template],
        html: params.html,
        text: params.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text();
      const error = `Resend HTTP ${res.status}: ${body.slice(0, 200)}`;
      await reportError('transactional email failed', { error, template: params.template });
      return { sent: false, error };
    }
    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: `notify.${params.template}`,
      actorId: 'system',
      resourceType: 'orders',
      resourceId: params.orderId || 'none',
      message: `Sent ${params.template} to ${params.to}`,
      metadata: { template: params.template },
    });
    return { sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'email send failed';
    await reportError('transactional email exception', { error, template: params.template });
    return { sent: false, error };
  }
}

export function orderEmailHtml(title: string, body: string, orderNumber: string): string {
  return `<div style="font-family:Inter,sans-serif;color:#16111b">
  <h1 style="font-family:Anton,sans-serif">${title}</h1>
  <p>${body}</p>
  <p>Order <strong>${orderNumber}</strong></p>
  <p>— StreetPlayR</p>
</div>`;
}
