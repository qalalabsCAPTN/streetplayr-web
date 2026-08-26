import { describe, expect, it } from 'vitest';
import { fromAddressSnapshot, toAddressSnapshot, unicommerceShipTo } from './address';

describe('canonical address aliases', () => {
  it('reads UniCommerce keys and checkout keys the same way', () => {
    const fromCheckout = fromAddressSnapshot({
      line1: '12 MG Road',
      postalCode: '560001',
      city: 'Bengaluru',
      state: 'KA',
      country: 'IN',
      phone: '9999999999',
      name: 'A',
      email: 'a@x.com',
    });
    const fromUni = fromAddressSnapshot({
      address_line_1: '12 MG Road',
      pincode: '560001',
      city: 'Bengaluru',
      state: 'KA',
      country: 'IN',
      phone: '9999999999',
      name: 'A',
      email: 'a@x.com',
    });
    expect(fromCheckout.line1).toBe(fromUni.line1);
    expect(fromCheckout.postalCode).toBe(fromUni.postalCode);
  });

  it('writes both alias sets for UniCommerce ship-to', () => {
    const snap = toAddressSnapshot({
      name: 'A',
      line1: '12 MG Road',
      line2: '',
      city: 'Bengaluru',
      state: 'KA',
      postalCode: '560001',
      country: 'IN',
      phone: '9999999999',
      email: 'a@x.com',
    });
    expect(snap.line1).toBe('12 MG Road');
    expect(snap.address_line_1).toBe('12 MG Road');
    expect(snap.postalCode).toBe('560001');
    expect(snap.pincode).toBe('560001');
    const ship = unicommerceShipTo(snap);
    expect(ship.addressLine1).toBe('12 MG Road');
    expect(ship.pincode).toBe('560001');
  });
});
