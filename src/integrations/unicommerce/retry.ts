export function soapTimeoutMs(): number {
  const n = Number(process.env.UNICOMMERCE_SOAP_TIMEOUT_MS || '12000');
  return Number.isFinite(n) && n >= 1000 ? n : 12000;
}

export function backoffMs(attempt: number, initialMs = 300): number {
  return initialMs * Math.pow(2, attempt) + Math.random() * 100;
}

export function isRetryableSoapError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return true;
  const msg = err.message || '';
  return (
    err.name === 'TypeError' ||
    msg.includes('fetch') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
  );
}
