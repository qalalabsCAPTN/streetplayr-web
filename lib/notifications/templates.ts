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
};

export function orderEmailHtml(title: string, body: string, orderNumber: string): string {
  return `<div style="font-family:Inter,sans-serif;color:#16111b">
  <h1 style="font-family:Anton,sans-serif">${title}</h1>
  <p>${body}</p>
  <p>Order <strong>${orderNumber}</strong></p>
  <p>— StreetPlayR</p>
</div>`;
}
