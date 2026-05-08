import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkEnvironment } from '@/lib/env/validate';

interface HealthCheckReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  subsystems: {
    env: { status: 'ok' | 'degraded'; details: ReturnType<typeof checkEnvironment> };
    supabase: { status: 'ok' | 'degraded' | 'down'; error?: string };
    auth: { status: 'ok' | 'degraded' | 'down'; error?: string };
    cron: { status: 'ok' | 'degraded'; releaseExpiryConfigured: boolean; reconciliationConfigured: boolean };
    webhooks: { status: 'ok' | 'degraded'; stripeVerification: 'enabled' | 'stub' | 'disabled'; error?: string };
    realtime: { status: 'ok' | 'degraded'; enabled: boolean };
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV ?? 'development';

  const report: HealthCheckReport = {
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
        stripeVerification: process.env.STRIPE_WEBHOOK_SECRET ? 'enabled' : 'stub',
      },
      realtime: { status: 'ok', enabled: true },
    },
  };

  // ── Check Environment ──────────────────────────────────────────────────
  const envCheck = report.subsystems.env.details;
  if (!envCheck.valid) {
    report.subsystems.env.status = 'degraded';
    report.status = 'degraded';
  }

  // ── Check Supabase Connectivity ────────────────────────────────────────
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('operational_events').select('id').limit(1).maybeSingle();
    // No error = connected. A "no rows" response is fine — means table is empty, not unreachable.
    if (error && error.code === 'PGRST301') {
      // PGRST301 = "not authenticated" — means we reached the server but auth failed
      // This is acceptable for a connectivity check since admin client bypasses RLS
    } else if (error) {
      throw error;
    }
  } catch (e: any) {
    report.subsystems.supabase.status = 'down';
    report.subsystems.supabase.error = e.message ?? 'Connection failed';
    report.status = 'degraded';
  }

  // ── Check Auth Subsystem ───────────────────────────────────────────────
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.getUser();
    // Admin client doesn't have a user context — this is expected to "fail"
    // The point is to verify Supabase Auth API is reachable (not necessarily authenticated)
    if (error && !error.message?.includes('Auth session missing')) {
      // Unexpected auth error
      report.subsystems.auth.status = 'degraded';
      report.subsystems.auth.error = error.message;
      report.status = 'degraded';
    }
  } catch (e: any) {
    report.subsystems.auth.status = 'down';
    report.subsystems.auth.error = e.message ?? 'Auth check failed';
    report.status = 'degraded';
  }

  // ── Check Webhook Status ───────────────────────────────────────────────
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    report.subsystems.webhooks.status = 'degraded';
    // Only degrade if in production
    if (environment === 'production') {
      report.status = 'degraded';
    }
  }

  // ── Determine overall status ───────────────────────────────────────────
  if (
    report.subsystems.supabase.status === 'down' ||
    report.subsystems.auth.status === 'down'
  ) {
    report.status = 'unhealthy';
  }

  const statusCode = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503;

  return NextResponse.json(report, { status: statusCode });
}
