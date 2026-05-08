/**
 * Environment Validation — production startup checks.
 *
 * Two tiers:
 *   BUILD-TIME (validateEnvironment): fails build if core Supabase vars missing.
 *   RUNTIME  (validateRuntime):       fails server start if production vars missing.
 *
 * This prevents silent empty-state failures while keeping developer builds working.
 */

const CORE_ENV_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-only)',
} as const;

const PRODUCTION_ENV_VARS = {
  STRIPE_SECRET_KEY: 'Stripe secret key (server-only)',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook signing secret',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
  CRON_SECRET: 'Secret for cron job authorization',
} as const;

const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_BRAND_ID: 'Commerce brand identifier',
  NEXT_PUBLIC_PHONE_PREFIX: 'Phone authentication prefix',
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'Sanity CMS project ID (Phase 3)',
  NEXT_PUBLIC_SANITY_DATASET: 'Sanity CMS dataset',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name (Phase 3)',
} as const;

export type EnvCheckResult = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

function collectMissing(vars: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const [key, description] of Object.entries(vars)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }
  return missing;
}

/**
 * BUILD-TIME validation. Blocks build if core Supabase vars are missing.
 * Called from next.config.ts — runs on every `next build` and `next start`.
 *
 * In development missing vars produce a warning but do NOT block startup,
 * allowing local work without a configured Supabase project.
 * In production missing vars throw and block startup.
 *
 * Does NOT require Stripe/cron vars — those are runtime-only checks.
 */
export function validateEnvironment(): EnvCheckResult {
  const missing = collectMissing(CORE_ENV_VARS);

  if (missing.length > 0) {
    const message =
      '[Env Validation] MISSING CORE ENV VARS:\n  ' +
      missing.join('\n  ');
    console.error(message);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Env Validation] MISSING CORE ENV VARS — build blocked:\n  ' +
        missing.join('\n  ')
      );
    }

    console.warn(
      '[Env Validation] Running in DEVELOPMENT mode — Supabase calls will return empty data. ' +
      'Set core env vars in .env for real data.'
    );
  }

  return { valid: missing.length === 0, missing, warnings: [] };
}

/**
 * RUNTIME validation. Checks production-critical vars (Stripe, cron).
 * Called during server initialization. Throws in production if missing.
 */
export function validateRuntime(): EnvCheckResult {
  const missing = collectMissing(PRODUCTION_ENV_VARS);
  const warnings = collectMissing(OPTIONAL_ENV_VARS);

  if (missing.length > 0) {
    const message =
      '[Env Validation] MISSING PRODUCTION ENV VARS:\n  ' +
      missing.join('\n  ');
    console.error(message);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
  }

  return { valid: missing.length === 0, missing, warnings };
}

/**
 * Comprehensive health-check-friendly check.
 * Returns status without throwing — safe for /api/health endpoints.
 */
export function checkEnvironment(): EnvCheckResult & {
  allRequired: string[];
  allOptional: string[];
} {
  const missing = [
    ...collectMissing(CORE_ENV_VARS),
    ...collectMissing(PRODUCTION_ENV_VARS),
  ];
  const warnings = collectMissing(OPTIONAL_ENV_VARS);

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    allRequired: Object.keys({ ...CORE_ENV_VARS, ...PRODUCTION_ENV_VARS }),
    allOptional: Object.keys(OPTIONAL_ENV_VARS),
  };
}

/**
 * Get a required env var or throw a descriptive error.
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Check your .env file or Vercel environment settings.`
    );
  }
  return value;
}
