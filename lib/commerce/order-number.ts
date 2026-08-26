import { randomBytes } from 'crypto';

/** Production order numbers: SP-YYYYMMDD-XXXXXX. Never DEMO-. */
export function generateOrderNumber(now = new Date()): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `SP-${day}-${rand}`;
}
