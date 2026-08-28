import { describe, expect, it } from 'vitest';
import { EMAIL_SUBJECT, orderEmailHtml, orderEmailText } from './templates';

describe('order confirmation email', () => {
  it('includes items and total for purchase receipts', () => {
    const details = {
      items: [{ title: 'Inspired Tee — M', quantity: 1, price: 2299 }],
      total: 2299,
      currency: 'INR',
    };
    const html = orderEmailHtml('Order confirmed', 'Payment verified.', 'SP-1', details);
    expect(html).toContain('SP-1');
    expect(html).toContain('Inspired Tee — M');
    expect(html).toContain('₹2,299');
    const text = orderEmailText('Order confirmed', 'Payment verified.', 'SP-1', details);
    expect(text).toContain('1 × Inspired Tee — M');
    expect(text).toContain('Total: ₹2,299');
  });

  it('escapes product titles in HTML', () => {
    const html = orderEmailHtml('Order confirmed', 'Payment verified.', 'SP-1', {
      items: [{ title: '<script>alert(1)</script>', quantity: 1, price: 10 }],
      total: 10,
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('has an email confirm subject', () => {
    expect(EMAIL_SUBJECT.email_confirm).toMatch(/confirm/i);
  });
});
