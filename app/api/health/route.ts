import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkEnvironment, launchEnvPresence } from '@/lib/env/validate';
import { UnicommerceService } from '@/src/integrations/unicommerce';

type SubStatus = 'ok' | 'degraded' | 'down';

interface PublicHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  subsystems: {
    env: SubStatus;
    supabase: SubStatus;
    auth: SubStatus;
    cron: SubStatus;
    webhooks: SubStatus;
    realtime: SubStatus;
    unicommerce: SubStatus;
  };
}

interface FullHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  subsystems: {
    env: { status: SubStatus; details: ReturnType<typeof checkEnvironment> };
    supabase: { status: SubStatus; error?: string };
    auth: { status: SubStatus; error?: string };
    cron: {
      status: SubStatus;
      releaseExpiryConfigured: boolean;
      reconciliationConfigured: boolean;
    };
    webhooks: {
      status: SubStatus;
      easebuzzConfigured: boolean;
      error?: string;
    };
    realtime: { status: SubStatus; enabled: boolean };
    unicommerce?: { status: SubStatus; details?: string; error?: string };
    nectar?: { status: SubStatus; details?: string };
    launchEnv?: ReturnType<typeof launchEnvPresence>;
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} check timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function isAuthorizedDiagnostics(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const query = req.nextUrl.searchParams.get('secret') || '';
  return bearer === secret || query === secret;
}

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV ?? 'development';
  const detailed = isAuthorizedDiagnostics(req);

  const report: FullHealthReport = {
    status: 'healthy',
    timestamp,
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? '0.1.0',
    environment,
    subsystems: {
      env: { status: 'ok', details: checkEnvironment() },
      supabase: { status: 'ok' },
      auth: { status: 'ok' },
      cron: {
        status: 'ok',
        releaseExpiryConfigured: !!process.env.CRON_SECRET,
        reconciliationConfigured: !!process.env.CRON_SECRET,
      },
      webhooks: {
        status: 'ok',
        easebuzzConfigured: Boolean(
          process.env.EASEBUZZ_MERCHANT_KEY && process.env.EASEBUZZ_SALT && process.env.EASEBUZZ_ENV
        ),
      },
      realtime: { status: 'ok', enabled: true },
      unicommerce: { status: 'ok', details: 'Checking connection...' },
      nectar: { status: 'ok', details: 'Checking configuration...' },
    },
  };

  const envCheck = report.subsystems.env.details;
  if (!envCheck.valid) {
    report.subsystems.env.status = 'degraded';
    report.status = 'degraded';
  }

  try {
    const admin = createAdminClient();
    const queryPromise = (async () => {
      return await admin.from('operational_events').select('id').limit(1).maybeSingle();
    })();
    const { error } = await withTimeout(queryPromise, 2500, 'Supabase query');
    if (error && error.code !== 'PGRST301') {
      throw error;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Connection failed';
    report.subsystems.supabase.status = 'degraded';
    report.subsystems.supabase.error = message;
    report.status = 'degraded';
  }

  try {
    const admin = createAdminClient();
    const { error } = await withTimeout(admin.auth.getUser(), 2500, 'Supabase auth');
    if (error && !error.message?.includes('Auth session missing')) {
      report.subsystems.auth.status = 'degraded';
      report.subsystems.auth.error = error.message;
      report.status = 'degraded';
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Auth check failed';
    report.subsystems.auth.status = 'degraded';
    report.subsystems.auth.error = message;
    report.status = 'degraded';
  }

  if (!process.env.CRON_SECRET) {
    report.subsystems.cron.status = 'degraded';
    if (environment === 'production') report.status = 'degraded';
  }

  if (!report.subsystems.webhooks.easebuzzConfigured) {
    report.subsystems.webhooks.status = 'degraded';
    if (environment === 'production') {
      report.status = 'degraded';
    }
  }

  const nectarBase =
    process.env.NECTAR_API_URL || process.env.NEXT_PUBLIC_NECTAR_API_URL || '';
  const nectarSecret =
    process.env.NECTAR_SIGNING_SECRET || process.env.PLATFORM_TOKEN_STREETPLAYR || '';
  if (!nectarBase || !nectarSecret) {
    report.subsystems.nectar = {
      status: 'degraded',
      details: 'NECTAR_API_URL / signing secret not fully configured',
    };
    if (environment === 'production') report.status = 'degraded';
  } else {
    try {
      const nectarProbe = await withTimeout(
        fetch(`${nectarBase.replace(/\/$/, '')}/health`, { method: 'GET' }).then(async (r) => ({
          ok: r.ok,
          status: r.status,
        })),
        2500,
        'Nectar',
      );
      report.subsystems.nectar = {
        status: nectarProbe.ok ? 'ok' : 'degraded',
        details: nectarProbe.ok ? `reachable (${nectarProbe.status})` : `HTTP ${nectarProbe.status}`,
      };
      if (!nectarProbe.ok && environment === 'production') report.status = 'degraded';
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nectar unreachable';
      report.subsystems.nectar = { status: 'degraded', details: message };
      if (environment === 'production') report.status = 'degraded';
    }
  }

  try {
    const ucCheck = await withTimeout(
      UnicommerceService.checkConnection(),
      2500,
      'Unicommerce',
    );
    report.subsystems.unicommerce = {
      status: ucCheck.success ? 'ok' : 'degraded',
      details: ucCheck.message,
    };
    if (!ucCheck.success && environment === 'production') {
      report.status = 'degraded';
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unicommerce check failed';
    report.subsystems.unicommerce = {
      status: 'degraded',
      error: message,
    };
    report.status = 'degraded';
  }

  // Always 200 so container boot / load balancers stay up; status field carries health.
  if (detailed) {
    report.subsystems.launchEnv = launchEnvPresence();
    return NextResponse.json(report, { status: 200 });
  }

  const publicReport: PublicHealthReport = {
    status: report.status,
    timestamp: report.timestamp,
    version: report.version,
    environment: report.environment,
    subsystems: {
      env: report.subsystems.env.status,
      supabase: report.subsystems.supabase.status,
      auth: report.subsystems.auth.status,
      cron: report.subsystems.cron.status,
      webhooks: report.subsystems.webhooks.status,
      realtime: report.subsystems.realtime.status,
      unicommerce: report.subsystems.unicommerce?.status ?? 'degraded',
    },
  };

  return NextResponse.json(publicReport, { status: 200 });
}
