import { describe, expect, it } from 'vitest';
import { buildCreateSaleOrderSoapBody } from './sale-order-soap';

describe('CreateSaleOrder SOAP body', () => {
  it('includes notification, prepaid payment, and channel product id', () => {
    const xml = buildCreateSaleOrderSoapBody({
      id: 'ord-1',
      displayCode: 'SP-1',
      createdAt: '2026-08-27T00:00:00.000Z',
      currency: 'INR',
      channelCode: 'CUSTOM',
      facilityCode: 'playR_Delhi',
      paymentAmount: 109,
      shippingAddress: {
        name: 'A',
        addressLine1: '12 MG',
        city: 'Delhi',
        state: 'DL',
        country: 'IN',
        pincode: '110001',
        phone: '9999999999',
        email: 'a@x.com',
      },
      items: [{ sku: 'PS-TEE-INS-PRP-M', price: 5, quantity: 1 }],
    });
    expect(xml).toContain('NotificationEmail');
    expect(xml).toContain('NotificationMobile');
    expect(xml).toContain('PREPAID');
    expect(xml).toContain('ChannelProductId');
    expect(xml).toContain('PS-TEE-INS-PRP-M');
    expect(xml).toMatch(/<ser:Code>SP-1-PS-TEE-INS-PRP-M-0<\/ser:Code>/);
    const itemCode = xml.match(/<ser:Code>(SP-1-[^<]+)<\/ser:Code>/)?.[1] ?? '';
    expect(itemCode.length).toBeLessThanOrEqual(45);
    expect(xml).toContain('CUSTOM');
    expect(xml).not.toMatch(/\$\{/);
  });
});
