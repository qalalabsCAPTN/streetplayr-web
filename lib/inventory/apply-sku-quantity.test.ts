import { describe, expect, it } from 'vitest';
import { parseUniwareInventoryPush, skuCandidatesFromUniwareItem } from './apply-sku-quantity';

describe('Uniware inventory push parse', () => {
  it('reads inventoryList productId + size variantId as full SKU', () => {
    const updates = parseUniwareInventoryPush({
      inventoryList: [
        { productId: 'PS-PNT-CARP-GRY', variantId: 'M', inventory: '0' },
      ],
    });
    expect(updates[0].sku).toBe('PS-PNT-CARP-GRY-M');
    expect(updates[0].quantity).toBe(0);
  });

  it('keeps a full variantId SKU', () => {
    expect(
      skuCandidatesFromUniwareItem({
        productId: 'PS-PNT-CARP-GRY',
        variantId: 'PS-PNT-CARP-GRY-S',
        inventory: 2,
      })
    ).toContain('PS-PNT-CARP-GRY-S');
  });

  it('accepts our webhook payload shape', () => {
    const updates = parseUniwareInventoryPush({
      payload: [{ sku: 'PS-TEE-CRT-RED-L', stock: 4 }],
    });
    expect(updates[0].sku).toBe('PS-TEE-CRT-RED-L');
    expect(updates[0].quantity).toBe(4);
  });
});
