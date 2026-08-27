/**
 * Environment-based configuration for the Unicommerce (Uniware) integration.
 */

export function normalizeUnicommerceApiUrl(raw: string | undefined | null): string {
  const trimmed = String(raw ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

export function buildUnicommerceSoapUrl(apiUrl: string, facilityCode?: string): string {
  const base = normalizeUnicommerceApiUrl(apiUrl);
  if (!base) {
    throw new Error(
      'UNICOMMERCE_API_URL is missing or not an absolute http(s) URL. Cannot call /services/soap as a relative path.'
    );
  }
  const endpoint = new URL('services/soap/', `${base}/`);
  endpoint.searchParams.set('version', '1.9');
  if (facilityCode) endpoint.searchParams.set('facility', facilityCode);
  return endpoint.toString();
}

export function isUnicommerceLiveConfigured(config?: UnicommerceConfig): boolean {
  const c = config ?? getUnicommerceConfig();
  return Boolean(normalizeUnicommerceApiUrl(c.apiUrl) && c.username && c.password);
}

export interface UnicommerceConfig {
  apiUrl: string;
  clientId: string;
  username: string;
  password: string;
  facilityCode: string;
  webhookSecret: string;
  isDemoMode: boolean;
  transportMode: 'REST' | 'SOAP';
}

/**
 * Validates and retrieves the Unicommerce configuration from environment variables.
 * In production mode, throws an error if required configuration is missing.
 */
export function getUnicommerceConfig(): UnicommerceConfig {
  const isDemoMode = process.env.DEMO_INVENTORY_MODE === 'true';


  const apiUrl = normalizeUnicommerceApiUrl(process.env.UNICOMMERCE_API_URL);
  const clientId = process.env.UNICOMMERCE_CLIENT_ID || 'my-trusted-client';
  const username = process.env.UNICOMMERCE_USERNAME || '';
  const password = process.env.UNICOMMERCE_PASSWORD || '';
  const facilityCode = process.env.UNICOMMERCE_FACILITY_CODE || '';
  const webhookSecret = process.env.UNICOMMERCE_WEBHOOK_SECRET || '';
  const transportMode = (process.env.UNICOMMERCE_TRANSPORT_MODE === 'REST' ? 'REST' : 'SOAP') as 'REST' | 'SOAP';

  const missing: string[] = [];
  if (!apiUrl) missing.push('UNICOMMERCE_API_URL');
  if (!username) missing.push('UNICOMMERCE_USERNAME');
  if (!password) missing.push('UNICOMMERCE_PASSWORD');
  if (!facilityCode) missing.push('UNICOMMERCE_FACILITY_CODE');

  // Never throw — this function is called at module static-init time via
  // `UnicommerceService.config = getUnicommerceConfig()` in index.ts.
  // Throwing here crashes the entire Next.js server process on startup.
  // Callers must check isDemoMode / apiUrl before making real API calls.
  if (missing.length > 0 && !isDemoMode) {
    console.warn(
      `[Unicommerce] Missing config: ${missing.join(', ')}. ` +
      `Set DEMO_INVENTORY_MODE=true or provide real credentials.`
    );
  }


  return {
    apiUrl,
    clientId,
    username,
    password,
    facilityCode,
    webhookSecret,
    isDemoMode,
    transportMode,
  };
}
