/**
 * Canonical shipping/billing address.
 *
 * Live `orders.shipping_address` is JSONB. Checkout historically wrote
 * `line1` / `postalCode`. UniCommerce historically read `address_line_1` /
 * `pincode`. Profile addresses use `pincode`. Persist ALL aliases so every
 * reader works without a second schema.
 */
export type CanonicalAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  gstin?: string;
};

export type AddressSnapshot = Record<string, string>;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/** 15-char GSTIN. Empty or junk is omitted — the field is optional and must not block checkout. */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export function normalizeGstin(raw: unknown): string | undefined {
  const v = str(raw).toUpperCase();
  if (!v) return undefined;
  if (!GSTIN_RE.test(v)) return undefined;
  return v;
}

export function fromAddressSnapshot(raw: unknown): CanonicalAddress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const line1 = str(r.line1 || r.address_line_1 || r.addressLine1);
  const postalCode = str(r.postalCode || r.pincode || r.zip || r.pin);
  return {
    name: str(r.name || r.full_name || r.fullName),
    line1,
    line2: str(r.line2 || r.address_line_2 || r.addressLine2),
    city: str(r.city),
    state: str(r.state),
    postalCode,
    country: str(r.country) || 'IN',
    phone: str(r.phone),
    email: str(r.email),
    gstin: normalizeGstin(r.gstin),
  };
}

export function toAddressSnapshot(address: CanonicalAddress): AddressSnapshot {
  const a = fromAddressSnapshot(address);
  return {
    name: a.name,
    full_name: a.name,
    line1: a.line1,
    address_line_1: a.line1,
    addressLine1: a.line1,
    line2: a.line2,
    address_line_2: a.line2,
    addressLine2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    pincode: a.postalCode,
    zip: a.postalCode,
    country: a.country,
    phone: a.phone,
    email: a.email,
    gstin: a.gstin ?? '',
  };
}

export function assertShippableAddress(address: CanonicalAddress): string | null {
  // GSTIN is optional (B2B). Missing or invalid GSTIN must never fail checkout.
  if (!address.line1) return 'Street address is required.';
  if (!address.city) return 'City is required.';
  if (!address.country) return 'Country is required.';
  if (address.country === 'IN' && !/^\d{6}$/.test(address.postalCode)) {
    return 'A 6-digit Indian PIN code is required.';
  }
  if (address.country !== 'IN' && address.postalCode.length < 3) {
    return 'Postal code is required.';
  }
  if (!address.phone || address.phone.replace(/\D/g, '').length < 10) {
    return 'A valid phone number is required.';
  }
  return null;
}

export function unicommerceShipTo(raw: unknown) {
  const a = fromAddressSnapshot(raw);
  return {
    name: a.name,
    addressLine1: a.line1,
    addressLine2: a.line2,
    city: a.city,
    state: a.state,
    country: a.country,
    pincode: a.postalCode,
    phone: a.phone,
    email: a.email,
  };
}
