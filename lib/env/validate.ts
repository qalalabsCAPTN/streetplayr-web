/**
 * Environment validation — build-time vs runtime production checks.
 */

const CORE_ENV_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-only)',
} as const;

const PRODUCTION_ENV_VARS = {
  EASEBUZZ_MERCHANT_KEY: 'Easebuzz merchant key (server-only)',
  EASEBUZZ_SALT: 'Easebuzz salt (server-only)',
  EASEBUZZ_ENV: 'Easebuzz environment (test|prod)',
  CRON_SECRET: 'Secret for cron job authorization',
} as const;

const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_BRAND_ID: 'Commerce brand identifier',
  NEXT_PUBLIC_PHONE_PREFIX: 'Phone authentication prefix',
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'Sanity CMS project ID (Phase 3)',
  NEXT_PUBLIC_SANITY_DATASET: 'Sanity CMS dataset',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name (Phase 3)',
  RESEND_API_KEY: 'Resend API key for transactional email',
  TRANSACTIONAL_FROM_EMAIL: 'From address for transactional email',
  SENTRY_DSN: 'Sentry DSN for error ingest',
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

/** Build-time: require core Supabase vars in production. */
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

/** Runtime: Easebuzz + cron required in production. */
export function validateRuntime(): EnvCheckResult {
  const missing = collectMissing(PRODUCTION_ENV_VARS);
  const warnings = collectMissing(OPTIONAL_ENV_VARS);

  if (process.env.EASEBUZZ_ENV && !['test', 'prod'].includes(process.env.EASEBUZZ_ENV)) {
    warnings.push(`EASEBUZZ_ENV must be 'test' or 'prod' (got '${process.env.EASEBUZZ_ENV}')`);
  }

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

/** Presence-only launch env. Never returns secret values. */
export function launchEnvPresence(): {
  vars: Record<string, 'SET' | 'MISSING' | 'INVALID'>;
  easebuzzEnv: 'prod' | 'test' | 'MISSING' | 'INVALID';
} {
  const ease = process.env.EASEBUZZ_ENV?.trim();
  const from = process.env.TRANSACTIONAL_FROM_EMAIL?.trim();
  const dsn = process.env.SENTRY_DSN?.trim();
  return {
    vars: {
      CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'MISSING',
      EASEBUZZ_MERCHANT_KEY: process.env.EASEBUZZ_MERCHANT_KEY ? 'SET' : 'MISSING',
      EASEBUZZ_SALT: process.env.EASEBUZZ_SALT ? 'SET' : 'MISSING',
      EASEBUZZ_ENV: !ease ? 'MISSING' : ['test', 'prod'].includes(ease) ? 'SET' : 'INVALID',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
      TRANSACTIONAL_FROM_EMAIL: !from ? 'MISSING' : from.includes('@') ? 'SET' : 'INVALID',
      SENTRY_DSN: !dsn ? 'MISSING' : (dsn.startsWith('https://') || dsn.includes('@')) ? 'SET' : 'INVALID',
    },
    easebuzzEnv: !ease ? 'MISSING' : ease === 'prod' || ease === 'test' ? ease : 'INVALID',
  };
}
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
