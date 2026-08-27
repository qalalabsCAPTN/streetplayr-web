import { describe, expect, it } from 'vitest';
import { buildUnicommerceSoapUrl, normalizeUnicommerceApiUrl } from './config';

describe('Uniware SOAP URL', () => {
  it('builds an absolute SOAP endpoint from a tenant host', () => {
    const url = buildUnicommerceSoapUrl('https://playr.unicommerce.com', 'playR_Delhi');
    expect(url.startsWith('https://playr.unicommerce.com/services/soap')).toBe(true);
    expect(url).toContain('version=1.9');
    expect(url).toContain('facility=playR_Delhi');
    expect(() => new URL(url)).not.toThrow();
  });

  it('rejects empty or relative API URLs — the bug that blocked order forward', () => {
    expect(normalizeUnicommerceApiUrl('')).toBe('');
    expect(normalizeUnicommerceApiUrl('/services/soap')).toBe('');
    expect(() => buildUnicommerceSoapUrl('')).toThrow(/UNICOMMERCE_API_URL/);
    expect(() => buildUnicommerceSoapUrl('/services/soap/?version=1.9')).toThrow(/UNICOMMERCE_API_URL/);
  });

  it('trims trailing slashes', () => {
    expect(normalizeUnicommerceApiUrl('https://playr.unicommerce.com/')).toBe(
      'https://playr.unicommerce.com'
    );
  });
});
