export type TransactionalTemplate =
  | 'order_confirmation'
  | 'payment_success'
  | 'payment_failure'
  | 'shipment'
  | 'delivery'
  | 'cancellation'
  | 'refund'
  | 'return_update'
  | 'contact_ack'
  | 'password_reset'
  | 'email_confirm';

export const EMAIL_SUBJECT: Record<TransactionalTemplate, string> = {
  order_confirmation: 'Your StreetPlayR order is confirmed',
  payment_success: 'Payment received — StreetPlayR',
  payment_failure: 'Payment failed — StreetPlayR',
  shipment: 'Your StreetPlayR order has shipped',
  delivery: 'Your StreetPlayR order was delivered',
  cancellation: 'Your StreetPlayR order was cancelled',
  refund: 'Refund processed — StreetPlayR',
  return_update: 'Return / exchange update — StreetPlayR',
  contact_ack: 'We received your message — StreetPlayR',
  password_reset: 'Reset your StreetPlayR password',
  email_confirm: 'Confirm your StreetPlayR account',
};

export type OrderEmailDetails = {
  items?: { title: string; quantity: number; price: number }[];
  total?: number;
  currency?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(amount: number, currency = 'INR'): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

export function orderEmailHtml(
  title: string,
  body: string,
  orderNumber: string,
  details?: OrderEmailDetails
): string {
  const items = details?.items ?? [];
  const itemBlock = items.length
    ? `<ul>${items
        .map(
          (item) =>
            `<li>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.title)} — ${escapeHtml(
              money(item.price, details?.currency)
            )}</li>`
        )
        .join('')}</ul>`
    : '';
  const totalBlock =
    details?.total != null
      ? `<p>Total <strong>${escapeHtml(money(details.total, details.currency))}</strong></p>`
      : '';
  return `<div style="font-family:Inter,sans-serif;color:#16111b">
  <h1 style="font-family:Anton,sans-serif">${escapeHtml(title)}</h1>
  <p>${escapeHtml(body)}</p>
  <p>Order <strong>${escapeHtml(orderNumber)}</strong></p>
  ${itemBlock}
  ${totalBlock}
  <p>— StreetPlayR</p>
</div>`;
}

export function orderEmailText(
  title: string,
  body: string,
  orderNumber: string,
  details?: OrderEmailDetails
): string {
  const items = (details?.items ?? [])
    .map((item) => `${item.quantity} × ${item.title} — ${money(item.price, details?.currency)}`)
    .join('\n');
  const total =
    details?.total != null ? `\nTotal: ${money(details.total, details.currency)}` : '';
  return `${title} — ${orderNumber}\n${body}${items ? `\n${items}` : ''}${total}`;
}
