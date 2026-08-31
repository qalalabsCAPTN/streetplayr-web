import { describe, expect, it } from 'vitest';
import { variantAttributesFromUniware, gstPercentFromUniwareCode } from './variant-attributes';

describe('variantAttributesFromUniware', () => {
  it('keeps UniWare color and size; stores EAN when it is not the SKU', () => {
    expect(
      variantAttributesFromUniware({
        sku: 'PS-TEE-INS-PRP-M',
        color: 'Purple',
        size: 'M',
        ean: '8905570042165',
      })
    ).toEqual({ color: 'Purple', size: 'M', ean: '8905570042165' });
  });

  it('ignores ScanIdentifier-as-SKU so attributes.ean is not a duplicate SKU', () => {
    expect(
      variantAttributesFromUniware({
        sku: 'PS-TEE-INS-PRP-M',
        color: 'Purple',
        size: 'M',
        ean: 'PS-TEE-INS-PRP-M',
      })
    ).toEqual({ color: 'Purple', size: 'M' });
  });

  it('does not invent color when UniWare sent none', () => {
    expect(variantAttributesFromUniware({ sku: 'PS-TEE-CRT-WHT-2XL', size: '2XL' })).toEqual({
      color: 'Default',
      size: '2XL',
    });
  });

  it('stores UniWare HSN and GST tax type on the variant', () => {
    expect(
      variantAttributesFromUniware({
        sku: 'PS-TEE-INS-PRP-M',
        color: 'Purple',
        size: 'M',
        ean: '8905570042165',
        hsn: '61091000',
        gstTaxTypeCode: '5',
      })
    ).toEqual({
      color: 'Purple',
      size: 'M',
      ean: '8905570042165',
      hsn: '61091000',
      gstTaxTypeCode: '5',
      gstRate: 5,
    });
  });

  it('parses GstTaxTypeCode 18', () => {
    expect(gstPercentFromUniwareCode('18')).toBe(18);
    expect(gstPercentFromUniwareCode('GST_5')).toBe(5);
    expect(gstPercentFromUniwareCode('')).toBeNull();
  });
});
