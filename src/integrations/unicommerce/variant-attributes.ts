import { normalizeSizeLabel, sizeFromSku } from '@/lib/products/sizes';

/** UniWare GstTaxTypeCode "5" / "18" / "GST_5" → percent. */
export function gstPercentFromUniwareCode(code?: string | null): number | null {
  const raw = (code || '').trim();
  if (!raw) return null;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0 || n > 28) return null;
  return n;
}

export function gstPercentFromAttributes(attrs: unknown): number | null {
  if (!attrs || typeof attrs !== 'object') return null;
  const rec = attrs as { gstRate?: unknown; gstTaxTypeCode?: unknown };
  if (typeof rec.gstRate === 'number') {
    return gstPercentFromUniwareCode(String(rec.gstRate));
  }
  if (typeof rec.gstTaxTypeCode === 'string') {
    return gstPercentFromUniwareCode(rec.gstTaxTypeCode);
  }
  return null;
}

/** UniWare item fields → product_variants.attributes. Never rewrite SKU. */
export function variantAttributesFromUniware(input: {
  sku: string;
  color?: string | null;
  size?: string | null;
  ean?: string | null;
  hsn?: string | null;
  gstTaxTypeCode?: string | null;
}): { color: string; size: string; ean?: string; hsn?: string; gstTaxTypeCode?: string; gstRate?: number } {
  const size = normalizeSizeLabel(input.size || sizeFromSku(input.sku));
  const color = (input.color || '').trim() || 'Default';
  const rawEan = (input.ean || '').trim();
  const ean = rawEan && rawEan.toLowerCase() !== input.sku.toLowerCase() ? rawEan : '';
  const hsn = (input.hsn || '').trim();
  const gstTaxTypeCode = (input.gstTaxTypeCode || '').trim();
  const gstRate = gstPercentFromUniwareCode(gstTaxTypeCode);
  const attrs: {
    color: string;
    size: string;
    ean?: string;
    hsn?: string;
    gstTaxTypeCode?: string;
    gstRate?: number;
  } = { color, size };
  if (ean) attrs.ean = ean;
  if (hsn) attrs.hsn = hsn;
  if (gstTaxTypeCode) attrs.gstTaxTypeCode = gstTaxTypeCode;
  if (gstRate != null) attrs.gstRate = gstRate;
  return attrs;
}
