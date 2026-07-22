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
}

/**
 * Validates and retrieves the Unicommerce configuration from environment variables.
 * In production mode, throws an error if required configuration is missing.
 */
export function getUnicommerceConfig(): UnicommerceConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const isDemoMode = process.env.DEMO_INVENTORY_MODE === 'true';

  const apiUrl = process.env.UNICOMMERCE_API_URL || '';
  const clientId = process.env.UNICOMMERCE_CLIENT_ID || 'my-trusted-client';
  const username = process.env.UNICOMMERCE_USERNAME || '';
  const password = process.env.UNICOMMERCE_PASSWORD || '';
  const facilityCode = process.env.UNICOMMERCE_FACILITY_CODE || '';
  const webhookSecret = process.env.UNICOMMERCE_WEBHOOK_SECRET || '';

  const missing: string[] = [];
  if (!apiUrl) missing.push('UNICOMMERCE_API_URL');
  if (!username) missing.push('UNICOMMERCE_USERNAME');
  if (!password) missing.push('UNICOMMERCE_PASSWORD');
  if (!facilityCode) missing.push('UNICOMMERCE_FACILITY_CODE');

  // During next build, we might not have these variables configured. Avoid blocking the build.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (missing.length > 0 && isProd && !isBuildPhase) {
    throw new Error(
      `[Unicommerce Integration] Missing required configuration parameters: ${missing.join(', ')}`
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
  };
}
