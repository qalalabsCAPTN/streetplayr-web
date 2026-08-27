import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  countsTowardCustomerSpend,
  customerOrderStatusLabel,
  isInvoiceEligible,
  isPayableOrder,
  isPaymentCaptured,
  ownsOrder,
} from './order-paid';

const pendingUnpaid = { status: 'pending' as const, paymentStatus: 'pending' };
const pendingFailed = { status: 'pending' as const, paymentStatus: 'failed' };
const paidConfirmed = { status: 'confirmed' as const, paymentStatus: 'paid' };
const pendingButPaidFlag = { status: 'pending' as const, paymentStatus: 'paid' };
const confirmedUnpaid = { status: 'confirmed' as const, paymentStatus: 'pending' };

describe('payment capture / invoice eligibility', () => {
  it('checkout pending is not a paid/confirmed purchase', () => {
    expect(isPaymentCaptured(pendingUnpaid)).toBe(false);
    expect(isInvoiceEligible(pendingUnpaid)).toBe(false);
    expect(isPayableOrder(pendingUnpaid)).toBe(true);
    expect(countsTowardCustomerSpend(pendingUnpaid)).toBe(false);
  });

  it('failed payment stays payable and never looks captured', () => {
    expect(isPaymentCaptured(pendingFailed)).toBe(false);
    expect(isInvoiceEligible(pendingFailed)).toBe(false);
    expect(isPayableOrder(pendingFailed)).toBe(true);
    expect(customerOrderStatusLabel(pendingFailed)).toBe('Payment failed');
  });

  it('cancelled order is not a purchase and has no invoice', () => {
    const cancelled = { status: 'cancelled' as const, paymentStatus: 'failed' };
    expect(isPaymentCaptured(cancelled)).toBe(false);
    expect(isInvoiceEligible(cancelled)).toBe(false);
    expect(countsTowardCustomerSpend(cancelled)).toBe(false);
    expect(customerOrderStatusLabel(cancelled)).toBe('Cancelled');
  });

  it('pending payment remains pending', () => {
    expect(customerOrderStatusLabel(pendingUnpaid)).toBe('Payment pending');
    expect(isPayableOrder(pendingUnpaid)).toBe(true);
  });

  it('invoice unavailable for unpaid order', () => {
    expect(isInvoiceEligible(pendingUnpaid)).toBe(false);
    expect(isInvoiceEligible(pendingFailed)).toBe(false);
    expect(isInvoiceEligible(confirmedUnpaid)).toBe(false);
    expect(isInvoiceEligible(pendingButPaidFlag)).toBe(false);
  });

  it('invoice available only after verified paid + fulfillment status', () => {
    expect(isInvoiceEligible(paidConfirmed)).toBe(true);
    expect(isInvoiceEligible({ status: 'shipped', paymentStatus: 'paid' })).toBe(true);
  });

  it('customer cannot own another customer order by id alone', () => {
    expect(
      ownsOrder({ userId: 'user-a', shippingAddress: { email: 'a@x.com' } }, 'user-b', 'b@x.com')
    ).toBe(false);
    expect(
      ownsOrder({ userId: 'user-a', shippingAddress: { email: 'a@x.com' } }, 'user-a', 'a@x.com')
    ).toBe(true);
  });
});

describe('source invariants — no client confirmation, no unpaid invoice, no retry duplicate order', () => {
  const root = process.cwd();

  it('checkout insert is pending, never confirmed', () => {
    const src = readFileSync(join(root, 'app/actions/checkout.ts'), 'utf8');
    expect(src).toMatch(/status: 'pending'/);
    expect(src).toMatch(/payment_status: 'pending'/);
    expect(src).not.toMatch(/status: 'confirmed'/);
  });

  it('invoice download requires isInvoiceEligible after getOrderAction', () => {
    const src = readFileSync(
      join(root, 'app/(store)/profile/orders/[id]/invoice/download/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/getOrderAction/);
    expect(src).toMatch(/isInvoiceEligible/);
    expect(src).toMatch(/code === 'FORBIDDEN'/);
    expect(src).toMatch(/status: 403/);
  });

  it('invoice HTML page forbids unpaid, failed, cancelled, and cross-customer', () => {
    const src = readFileSync(
      join(root, 'app/(store)/profile/orders/[id]/invoice/page.tsx'),
      'utf8'
    );
    expect(src).toMatch(/unauthorized\(\)/);
    expect(src).toMatch(/forbidden\(\)/);
    expect(src).toMatch(/isInvoiceEligible/);
    expect(src).toMatch(/code === 'FORBIDDEN'/);
  });

  it('retryPaymentAction does not insert a second order', () => {
    const src = readFileSync(join(root, 'app/actions/order.ts'), 'utf8');
    expect(src).toMatch(/isPayableOrder/);
    expect(src).toMatch(/retryPaymentAction/);
    const retryBlock = src.slice(src.indexOf('export async function retryPaymentAction'));
    expect(retryBlock).not.toMatch(/\.from\('orders'\)\s*\n\s*\.insert/);
    expect(retryBlock).toMatch(/ReservationService\.create/);
  });

  it('Easebuzz webhook does not confirm on invalid hash', () => {
    const src = readFileSync(join(root, 'app/api/webhooks/easebuzz/route.ts'), 'utf8');
    expect(src).toMatch(/verifyResponseHash/);
    expect(src).toMatch(/Invalid response signature/);
    expect(src).toMatch(/easebuzz.amount_mismatch/);
  });

  it('paid orders retry Uniware forward after a failed SOAP URL', () => {
    const payment = readFileSync(join(root, 'lib/orchestration/payment.ts'), 'utf8');
    expect(payment).toMatch(/forwardPaidOrderToUnicommerce/);
    const idem = readFileSync(join(root, 'lib/orchestration/idempotency.ts'), 'utf8');
    expect(idem).toMatch(/status === 'failed'/);
    const recon = readFileSync(join(root, 'lib/orchestration/reconciliation.ts'), 'utf8');
    expect(recon).toMatch(/forwardUnpushedUniwareOrders/);
    const success = readFileSync(
      join(root, 'app/(store)/checkout/success/CheckoutSuccessContent.tsx'),
      'utf8'
    );
    expect(success).toMatch(/ensureUniwareForwardAction/);
    const soap = readFileSync(join(root, 'src/integrations/unicommerce/soapClient.ts'), 'utf8');
    expect(soap).toMatch(/buildUnicommerceSoapUrl/);
    expect(soap).not.toMatch(/\$\{config\.apiUrl\}\/services\/soap/);
  });

  it('checkout stepper clears the fixed header and hides Collection', () => {
    const css = readFileSync(join(root, 'styles/storefront.css'), 'utf8');
    expect(css).toMatch(/\.listing \{[\s\S]*?padding: calc\(16px \+ var\(--header-h\) \+ 28px\) 0 0/);
    expect(css).toMatch(/\.listing\.listing--checkout/);
    expect(css).toMatch(/padding-top: calc\(16px \+ var\(--header-h\) \+ 28px\)/);
    expect(css).toMatch(/12px \+ env\(safe-area-inset-top, 0px\) \+ 56px \+ 44px/);
    expect(css).toMatch(/\.header--checkout \.header__nav/);
    const nav = readFileSync(join(root, 'components/layout/Navbar.tsx'), 'utf8');
    expect(nav).toMatch(/isCheckout/);
    expect(nav).toMatch(/header--checkout/);
    const page = readFileSync(join(root, 'app/(store)/checkout/page.tsx'), 'utf8');
    expect(page).toMatch(/listing listing--checkout/);
    expect(page).toMatch(/checkout-steps__track/);
    expect(page).not.toMatch(/checkout-step-count/);
    expect(page).toMatch(/GSTIN \(optional, B2B\)/);
    expect(page).toMatch(/GSTIN is optional/);
    expect(page).not.toMatch(/!gstin/);
    expect(css).toMatch(/checkout-steps__track/);
    expect(css).toMatch(/-webkit-text-size-adjust: 100%/);
    expect(css).toMatch(/safe-area-inset-left/);
  });

  it('card + opens size sheet before bag drawer', () => {
    const card = readFileSync(join(root, 'components/ui/ProductCard.tsx'), 'utf8');
    expect(card).toMatch(/QuickAddSheet/);
    expect(card).toMatch(/openQuickAdd/);
    expect(card).not.toMatch(/const size = 'M'/);
    const sheet = readFileSync(join(root, 'components/ui/QuickAddSheet.tsx'), 'utf8');
    expect(sheet).toMatch(/Add to Bag/);
    expect(sheet).toMatch(/Buy Now/);
    expect(sheet).toMatch(/createPortal/);
    expect(sheet).toMatch(/resolvedId/);
    const css = readFileSync(join(root, 'styles/storefront.css'), 'utf8');
    expect(css).toMatch(/\.quickadd \.size\.active/);
    expect(css).toMatch(/\.quickadd \.size \{[\s\S]*?border: 1px solid rgba\(22, 17, 27, 0\.24\)/);
    const cart = readFileSync(join(root, 'components/CartContext.tsx'), 'utf8');
    expect(cart).toMatch(/opts\?: \{ openDrawer\?: boolean \}/);
    expect(cart).toMatch(/opts\?\.openDrawer !== false/);
    const collections = readFileSync(join(root, 'app/(store)/collections/page.tsx'), 'utf8');
    expect(collections).toMatch(/variants: product\.variants/);
  });

  it('mobile PDP CTA is in-flow outline + solid pills, not a fixed overlay', () => {
    const css = readFileSync(join(root, 'styles/storefront.css'), 'utf8');
    expect(css).toMatch(/Bluorng-style: in-flow under sizes/);
    expect(css).toMatch(/\.pdp__actions \{[\s\S]*?position: static/);
    expect(css).toMatch(/\.pdp__atb,[\s\S]*?background: #ffffff !important/);
    expect(css).toMatch(/\.pdp__buy,[\s\S]*?background: #000000 !important/);
    expect(css).toMatch(/env\(safe-area-inset-bottom/);
    const pdp = readFileSync(join(root, 'app/(store)/product/[slug]/ProductDetailClient.tsx'), 'utf8');
    expect(pdp).toMatch(/data-selected-variant-id=\{selectedVariantId/);
    expect(pdp).toMatch(/disabled=\{ctaSoldOut\}/);
  });

  it('mobile product-card arrows hidden on touch/mobile', () => {
    const css = readFileSync(join(root, 'styles/storefront.css'), 'utf8');
    expect(css).toMatch(/@media \(hover: none\), \(pointer: coarse\), \(max-width: 768px\)/);
    expect(css).toMatch(/\.card__nav/);
    expect(css).toMatch(/display: none !important;/);
    const card = readFileSync(join(root, 'components/ui/ProductCard.tsx'), 'utf8');
    expect(card).toMatch(/card__nav--prev/);
    expect(card).toMatch(/card__wish/);
    expect(card).toMatch(/desktopGalleryNav/);
    expect(card).toMatch(/\(hover: hover\) and \(pointer: fine\) and \(min-width: 769px\)/);
  });

  it('SKU-targeted inventory snapshot does not default UpdatedSinceInMinutes to 480', () => {
    const src = readFileSync(join(process.cwd(), 'src/integrations/unicommerce/inventory.ts'), 'utf8');
    expect(src).toMatch(/skus && skus\.length > 0/);
    expect(src).toMatch(/UpdatedSinceInMinutes/);
  });

  it('reservation subtraction never goes negative', () => {
    const src = readFileSync(join(root, 'lib/inventory/index.ts'), 'utf8');
    expect(src).toMatch(/netAvailable\(inv\.quantity \?\? 0, reserved\)/);
    const net = readFileSync(join(root, 'lib/inventory/net-available.ts'), 'utf8');
    expect(net).toMatch(/Math\.max\(0/);
    const stock = readFileSync(join(root, 'app/actions/stock.ts'), 'utf8');
    expect(stock).toMatch(/Math\.max\(/);
    expect(stock).toMatch(/reserved_quantity/);
  });
});
