import { describe, expect, it } from 'vitest';
import { backoffMs, isRetryableSoapError, soapTimeoutMs } from './retry';

describe('UniCommerce retry/timeout helpers', () => {
  it('uses a finite SOAP timeout', () => {
    expect(soapTimeoutMs()).toBeGreaterThanOrEqual(1000);
    expect(soapTimeoutMs()).toBeLessThanOrEqual(60000);
  });

  it('backs off exponentially', () => {
    const a0 = backoffMs(0, 300);
    const a2 = backoffMs(2, 300);
    expect(a0).toBeGreaterThanOrEqual(300);
    expect(a2).toBeGreaterThan(a0);
  });

  it('retries timeouts and connection resets', () => {
    expect(isRetryableSoapError({ name: 'TimeoutError', message: 'aborted' })).toBe(true);
    expect(isRetryableSoapError({ name: 'Error', message: 'ETIMEDOUT' })).toBe(true);
    expect(isRetryableSoapError({ name: 'Error', message: 'SOAP Fault' })).toBe(false);
  });
});
