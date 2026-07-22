/**
 * Authentication Module for Unicommerce.
 * Manages token acquisition, caching, concurrent request locking, and refresh logic.
 */

import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import type { UniwareTokenResponse } from './types';

let cachedToken: string | null = null;
let tokenExpiresAt = 0; // Epoch milliseconds
let pendingAuthPromise: Promise<string> | null = null;

/**
 * Retrieves a valid access token. Uses cached token if valid.
 * Handles concurrent requests by sharing the auth promise.
 */
export async function getAccessToken(): Promise<string> {
  const config = getUnicommerceConfig();

  // If in demo mode and no real credentials configured, return a stub token
  if (config.isDemoMode && !config.apiUrl) {
    return 'demo-mode-token-stub';
  }

  // Check if we have a valid cached token (with 60 seconds buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // If an auth request is already in progress, wait for it
  if (pendingAuthPromise) {
    return pendingAuthPromise;
  }

  // Start auth flow
  pendingAuthPromise = (async () => {
    try {
      await UnicommerceLogger.info('auth.token_request', 'Requesting new Unicommerce OAuth token');

      // Unicommerce OAuth token endpoint uses GET or POST with query params
      const authUrl = new URL(`${config.apiUrl}/oauth/token`);
      authUrl.searchParams.append('grant_type', 'password');
      authUrl.searchParams.append('client_id', config.clientId);
      authUrl.searchParams.append('username', config.username);
      authUrl.searchParams.append('password', config.password);

      const response = await fetch(authUrl.toString(), {
        method: 'POST', // Unicommerce supports both, POST is standard for OAuth
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as UniwareTokenResponse;

      if (!data.access_token) {
        throw new Error('Response did not contain access_token');
      }

      cachedToken = data.access_token;
      // expires_in is in seconds, convert to epoch milliseconds
      tokenExpiresAt = Date.now() + (data.expires_in ?? 36000) * 1000;

      await UnicommerceLogger.info(
        'auth.token_success',
        `Acquired access token successfully. Expires in ${data.expires_in}s.`
      );

      return cachedToken;
    } catch (err: any) {
      await UnicommerceLogger.error('auth.token_failure', 'Failed to authenticate with Unicommerce', err);
      // Reset state so next call retries
      cachedToken = null;
      tokenExpiresAt = 0;
      throw err;
    } finally {
      // Clear pending promise
      pendingAuthPromise = null;
    }
  })();

  return pendingAuthPromise;
}

/**
 * Manually invalidates the cached token. Use if an API request returns 401 Unauthorized.
 */
export function invalidateToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}
