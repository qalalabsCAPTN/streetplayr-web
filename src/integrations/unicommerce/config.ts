/**
 * Environment-based configuration for the Unicommerce (Uniware) integration.
 */

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


  const apiUrl = process.env.UNICOMMERCE_API_URL || '';
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
    apiUrl: apiUrl.replace(/\/$/, ''), // Remove trailing slash if present
    clientId,
    username,
    password,
    facilityCode,
    webhookSecret,
    isDemoMode,
    transportMode,
  };
}
