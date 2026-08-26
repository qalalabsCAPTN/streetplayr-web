/**
 * GA4 + Meta ecommerce events. IDs live in lib/analytics/tags.ts.
 * Safe no-op on the server.
 */

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
};

function gtagEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag === 'function') {
    w.gtag('event', name, payload);
  } else {
    w.dataLayer.push({ event: name, ...payload });
  }
}

function fbqTrack(name: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { fbq?: (...args: unknown[]) => void };
  if (typeof w.fbq === 'function') w.fbq('track', name, payload);
}

export function trackViewItem(item: EcommerceItem) {
  gtagEvent('view_item', { currency: 'INR', value: item.price, items: [item] });
  fbqTrack('ViewContent', { value: item.price, currency: 'INR', content_ids: [item.item_id] });
}

export function trackAddToCart(item: EcommerceItem) {
  gtagEvent('add_to_cart', { currency: 'INR', value: item.price * (item.quantity ?? 1), items: [item] });
  fbqTrack('AddToCart', { value: item.price * (item.quantity ?? 1), currency: 'INR', content_ids: [item.item_id] });
}

export function trackBeginCheckout(value: number, items: EcommerceItem[]) {
  gtagEvent('begin_checkout', { currency: 'INR', value, items });
  fbqTrack('InitiateCheckout', { value, currency: 'INR' });
}

export function trackPurchase(orderId: string, value: number, items: EcommerceItem[]) {
  gtagEvent('purchase', { transaction_id: orderId, currency: 'INR', value, items });
  fbqTrack('Purchase', { value, currency: 'INR', content_ids: items.map((i) => i.item_id) });
}
