import type { ISO8601 } from './common.js';

// ============================================================
// Platform — external platform registration and SDK config
// ============================================================

export interface Platform {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  webhookUrl?: string;
  /** HMAC secret for validating incoming event signatures */
  signingSecret: string;
  allowedEventTypes?: string[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface PlatformToken {
  platformId: string;
  token: string;
  expiresAt?: ISO8601;
  scopes: PlatformScope[];
  createdAt: ISO8601;
}

export type PlatformScope =
  | 'events:write'
  | 'events:read'
  | 'users:read'
  | 'wallet:read'
  | 'profile:read'
  | 'referrals:write';

export interface SDKConfig {
  platformId: string;
  endpoint: string;
  version: string;
  supportedEvents: string[];
}
