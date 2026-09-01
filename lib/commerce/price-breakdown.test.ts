import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('GST breakdown display — MRP split, server-quoted', () => {
  it('checkout summary never says GST included in basic amount', () => {
    const page = readFileSync(join(root, 'app/(store)/checkout/page.tsx'), 'utf8');
    expect(page).toMatch(/OrderPriceBreakdown/);
    expect(page).not.toMatch(/GST \(incl\.\)/);
    expect(page).not.toMatch(/Taxes included/);
  });

  it('cart and drawer never claim taxes included', () => {
    const cart = readFileSync(join(root, 'app/(store)/cart/page.tsx'), 'utf8');
    const drawer = readFileSync(join(root, 'components/cart/CartDrawer.tsx'), 'utf8');
    expect(cart).toMatch(/OrderPriceBreakdown/);
    expect(drawer).toMatch(/OrderPriceBreakdown/);
    expect(cart).not.toMatch(/Taxes included/);
    expect(drawer).not.toMatch(/Taxes included/);
  });

  it('customer order list, detail, invoice, admin, and success use canonical OrderPriceBreakdown', () => {
    const breakdown = readFileSync(join(root, 'components/commerce/OrderPriceBreakdown.tsx'), 'utf8');
    expect(breakdown).toMatch(/Basic Amount/);
    expect(breakdown).toMatch(/GST/);
    expect(breakdown).toMatch(/shippingDisplay/);
    expect(breakdown).not.toMatch(/GST \(incl\.\)/);

    const orderList = readFileSync(join(root, 'app/(store)/profile/orders/page.tsx'), 'utf8');
    const order = readFileSync(join(root, 'app/(store)/profile/orders/[id]/page.tsx'), 'utf8');
    const invoice = readFileSync(join(root, 'app/(store)/profile/orders/[id]/invoice/page.tsx'), 'utf8');
    const download = readFileSync(
      join(root, 'app/(store)/profile/orders/[id]/invoice/download/route.ts'),
      'utf8'
    );
    const admin = readFileSync(join(root, 'app/admin/orders/[id]/page.tsx'), 'utf8');
    const success = readFileSync(
      join(root, 'app/(store)/checkout/success/CheckoutSuccessContent.tsx'),
      'utf8'
    );
    for (const src of [orderList, order, invoice, admin, success]) {
      expect(src).toMatch(/OrderPriceBreakdown/);
    }
    expect(download).toMatch(/Basic Amount/);
    expect(download).toMatch(/GST/);
    expect(download).toMatch(/shippingDisplay/);
  });

  it('Easebuzz still charges orders.grand_total only', () => {
    const src = readFileSync(join(root, 'app/actions/easebuzz.ts'), 'utf8');
    expect(src).toMatch(/from\('orders'\)/);
    expect(src).toMatch(/grand_total/);
    expect(src).toMatch(/amountStr = Number\(order\.grand_total\)/);
    expect(src).not.toMatch(/shippingAddress\.taxAmount/);
  });

  it('ops order list shows Basic Amount, Shipping, GST from order row', () => {
    const src = readFileSync(join(root, 'app/(ops)/ops/orders/page.tsx'), 'utf8');
    expect(src).toMatch(/Basic Amount/);
    expect(src).toMatch(/GST/);
    expect(src).toMatch(/shippingDisplay/);
  });

  it('server totals split GST from UniWare MRP, never add on top', () => {
    const src = readFileSync(join(root, 'lib/commerce/totals.ts'), 'utf8');
    expect(src).toMatch(/splitInclusiveMrp/);
    expect(src).toMatch(/Never add GST on top/);
  });

  it('cart preview and checkout quote both call quoteTotals on the server', () => {
    const src = readFileSync(join(root, 'app/actions/checkout.ts'), 'utf8');
    expect(src).toMatch(/previewCartTotalsAction/);
    expect(src).toMatch(/quoteTotals/);
    expect(src).toMatch(/cartGstPercent/);
    expect(src).not.toMatch(/shippingAddress\.taxAmount\s*\?\?/);
  });
});
