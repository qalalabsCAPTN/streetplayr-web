import { describe, expect, it } from 'vitest';
import { isValidPhone, validateNotifyMeInput } from './validate';

describe('notify-me validation', () => {
  const base = {
    name: 'Aayush Singh',
    email: 'aayush@example.com',
    phone: '9876543210',
    productId: 'prod-1',
    productName: 'playR Street Carpenter Pant Fleece (Grey)',
    productHandle: 'PS-PNT-CARP-GRY',
  };

  it('accepts a complete valid payload', () => {
    expect(validateNotifyMeInput(base)).toEqual({});
  });

  it('requires name, email, and phone', () => {
    const errors = validateNotifyMeInput({ ...base, name: ' ', email: 'nope', phone: '12' });
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
  });

  it('accepts +91 and spaced Indian numbers', () => {
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('09876543210')).toBe(true);
  });

  it('rejects incomplete payloads', () => {
    expect(validateNotifyMeInput({ ...base, productId: '' }).product).toBeTruthy();
  });
});
