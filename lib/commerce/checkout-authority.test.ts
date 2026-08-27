import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { join } from 'path';

const root = process.cwd();

describe('checkout / order schema authority', () => {
  it('checkout never returns empty fake reservationIds and never honors client shipping/tax', () => {
    const src = readFileSync(join(root, 'app/actions/checkout.ts'), 'utf8');
    expect(src).not.toMatch(/reservationIds:\s*\[\s*\]/);
    expect(src).toMatch(/Ignored\. Server quotes shipping/);
    expect(src).not.toMatch(/shippingAddress\.shippingCost/);
    expect(src).not.toMatch(/shippingAddress\.taxAmount/);
    expect(src).not.toMatch(/DEMO-/);
    expect(src).toMatch(/customer_id/);
    expect(src).toMatch(/grand_total/);
    expect(src).toMatch(/unit_price/);
    expect(src).not.toMatch(/user_id:/);
  });

  it('admin order list uses live columns not user_id/total', () => {
    const src = readFileSync(join(root, 'app/actions/ops/orders-admin.ts'), 'utf8');
    expect(src).toMatch(/grand_total/);
    expect(src).toMatch(/customer_id/);
    expect(src).not.toMatch(/select\('id, user_id, status, total/);
  });

  it('success page only clears cart after paid statuses', () => {
    const src = readFileSync(
      join(root, 'app/(store)/checkout/success/CheckoutSuccessContent.tsx'),
      'utf8'
    );
    expect(src).toMatch(/PAID/);
    expect(src).toMatch(/setState\('pending'\)/);
    expect(src).toMatch(/clearCart\(\)/);
    expect(src).toMatch(/paymentStatus === 'paid'/);
  });
});
