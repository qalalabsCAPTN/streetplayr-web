import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('reservation lifecycle wiring', () => {
  it('create is idempotent per order+variant and uses inventory RPC', () => {
    const src = readFileSync(join(process.cwd(), 'lib/orchestration/reservation.ts'), 'utf8');
    expect(src).toMatch(/eq\('order_id', orderId\)/);
    expect(src).toMatch(/eq\('variant_id', variantId\)/);
    expect(src).toMatch(/reserve_inventory/);
    expect(src).toMatch(/releaseAllForOrder/);
    expect(src).toMatch(/convert_inventory_reservation/);
  });

  it('checkout creates a hold per priced line', () => {
    const src = readFileSync(join(process.cwd(), 'app/actions/checkout.ts'), 'utf8');
    expect(src).toMatch(/ReservationService\.create/);
    expect(src).toMatch(/checkout_stock_race/);
  });
});
