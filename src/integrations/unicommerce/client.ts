/**
 * Unicommerce Base HTTP Client with Exponential Backoff Retry logic and SRE observability.
 */

import { getUnicommerceConfig } from './config';
import { getAccessToken, invalidateToken } from './auth';
import { UnicommerceLogger } from './logging';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any; // JSON body
  headers?: Record<string, string>;
  skipAuth?: boolean;
  correlationId?: string;
  requestId?: string;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 300;

/**
 * Sleeps for a given duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core HTTP Request dispatcher with automatic token management, 
 * error classification, exponential backoff retries, and latency tracking.
 */
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const config = getUnicommerceConfig();

  const url = `${config.apiUrl}${endpoint}`;
  const method = options.method ?? 'POST';

  // SRE Correlation & Request Tracking
  const correlationId = options.correlationId || options.headers?.['x-correlation-id'] || `corr_${Math.random().toString(36).substr(2, 9)}`;
  const requestId = options.requestId || options.headers?.['x-request-id'] || `req_${Math.random().toString(36).substr(2, 9)}`;

  const logMeta = {
    correlationId,
    requestId,
    apiEndpoint: endpoint,
    method,
  };

  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= MAX_RETRIES) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Facility': config.facilityCode,
        'x-correlation-id': correlationId,
        'x-request-id': requestId,
        ...options.headers,
      };

      if (!options.skipAuth) {
        const token = await getAccessToken();
        headers['Authorization'] = `bearer ${token}`;
      }

      const fetchOptions: RequestInit = {
        ...options,
        method,
        headers,
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);
      const latency = Date.now() - startTime;

      // Handle 401 Unauthorized - could be an expired token, clear cache & retry
      if (response.status === 401 && !options.skipAuth) {
        await UnicommerceLogger.warn(
          'client.unauthorized',
          `Access token rejected (401). Invalidating cache and retrying.`,
          'system',
          { ...logMeta, latency, httpStatus: response.status, attempt }
        );
        invalidateToken();
        attempt++;
        continue;
      }

      // Handle transient errors (429 Rate Limit, 5xx Server Errors)
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        const msg = `HTTP Status ${response.status}: ${errorText || response.statusText}`;

        if (attempt === MAX_RETRIES) {
          throw new Error(`Max retries reached. Final error: ${msg}`);
        }

        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 100;
        await UnicommerceLogger.warn(
          'client.retry',
          `Transient HTTP error. Retrying attempt ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms. Error: ${msg}`,
          'system',
          { ...logMeta, latency, httpStatus: response.status, attempt, retryDelay: delay }
        );

        await sleep(delay);
        attempt++;
        continue;
      }

      // Handle other non-ok HTTP statuses
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const json = (await response.json()) as any;
      const finalLatency = Date.now() - startTime;

      // Handle application-level errors returned by Unicommerce in successful HTTP status
      if (json && typeof json === 'object' && 'successful' in json && json.successful === false) {
        const errors = json.errors || [];
        const errorMsg = errors.map((e: any) => `${e.code}: ${e.message}`).join(', ') || 'Unknown Uniware error';
        throw new Error(`[Uniware API Error] ${errorMsg}`);
      }

      // Log successful request metrics
      await UnicommerceLogger.info(
        'client.request_success',
        `Unicommerce API request succeeded on ${method} ${endpoint}`,
        'system',
        { ...logMeta, latency: finalLatency, httpStatus: response.status, attempt }
      );

      return json as T;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      // Catch network-level issues
      const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 100;
        await UnicommerceLogger.warn(
          'client.retry_network',
          `Network issue on connection attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${Math.round(delay)}ms. Error: ${error.message}`,
          'system',
          { ...logMeta, latency, attempt, retryDelay: delay }
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      await UnicommerceLogger.error(
        'client.request_error',
        `Unicommerce API request failed on ${method} ${endpoint}`,
        error,
        'system',
        { ...logMeta, latency, attempt }
      );
      throw error;
    }
  }

  throw new Error('Request execution failed unexpectedly');
}
