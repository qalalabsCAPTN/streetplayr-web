import { describe, expect, it } from 'vitest';
import { NOTIFY_ME_HEADERS, notifyMeSheetValues, sheetHeadersNeedUpdate } from './append-sheet';

describe('notify-me sheet mapping', () => {
  it('maps Name and Email into the existing first two columns', () => {
    const values = notifyMeSheetValues({
      name: 'Riya',
      email: 'riya@example.com',
      phone: '9876543210',
      timestamp: '2026-09-11T10:30:00.000Z',
      productName: 'playR Street Carpenter Pant Fleece (Grey)',
      productId: 'abc',
      productHandle: 'PS-PNT-CARP-GRY',
      variants: 'XS, S, M, L, XL, 2XL',
    });
    expect(NOTIFY_ME_HEADERS[0]).toBe('Name');
    expect(NOTIFY_ME_HEADERS[1]).toBe('Email');
    expect(values[0]).toBe('Riya');
    expect(values[1]).toBe('riya@example.com');
    expect(values[2]).toBe('9876543210');
    expect(values[4]).toBe('playR Street Carpenter Pant Fleece (Grey)');
    expect(values[6]).toBe('PS-PNT-CARP-GRY');
  });

  it('flags the live sheet Name/Email-only header row as needing Phone and product columns', () => {
    expect(sheetHeadersNeedUpdate(['Name  ', 'Email '])).toBe(true);
    expect(sheetHeadersNeedUpdate([...NOTIFY_ME_HEADERS])).toBe(false);
  });
});