export type NotifyMeInput = {
  name: string;
  email: string;
  phone: string;
  productId: string;
  productName: string;
  productHandle: string;
  variants?: string;
  website?: string;
};

export type NotifyMeFieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'product', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhoneDigits(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '');
}

export function isValidPhone(raw: string): boolean {
  const digits = normalizePhoneDigits(raw);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return true;
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) return true;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return true;
  if (digits.length >= 8 && digits.length <= 15 && /^[1-9]/.test(digits)) return true;
  return false;
}

export function validateNotifyMeInput(input: NotifyMeInput): NotifyMeFieldErrors {
  const errors: NotifyMeFieldErrors = {};
  const name = String(input.name ?? '').trim();
  const email = String(input.email ?? '').trim();
  const phone = String(input.phone ?? '').trim();
  const productId = String(input.productId ?? '').trim();
  const productName = String(input.productName ?? '').trim();
  const productHandle = String(input.productHandle ?? '').trim();

  if (name.length < 2 || name.length > 80) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(email) || email.length > 120) errors.email = 'Enter a valid email.';
  if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number.';
  if (!productId || !productName || !productHandle || productHandle.length > 160) {
    errors.product = 'Product is missing.';
  }
  return errors;
}
