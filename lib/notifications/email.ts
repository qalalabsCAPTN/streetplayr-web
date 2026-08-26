import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import { reportError } from '@/lib/monitoring/report';
import { getSmtpConfig } from './smtp';
import { EMAIL_SUBJECT, type TransactionalTemplate } from './templates';

export type { TransactionalTemplate };
export { orderEmailHtml } from './templates';

type SendMailer = {
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<{ accepted?: unknown[] }>;
};

let testMailer: SendMailer | null = null;

/** Test-only injection. Not used in production. */
export function __setMailerForTests(mailer: SendMailer | null): void {
  testMailer = mailer;
}

async function alreadySent(orderId: string, template: TransactionalTemplate): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('operational_events')
      .select('id')
      .eq('action', `notify.${template}`)
      .eq('resource_id', orderId)
      .eq('severity', 'info')
      .limit(1)
      .maybeSingle();
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function sendTransactionalEmail(params: {
  to: string;
  template: TransactionalTemplate;
  html: string;
  text: string;
  orderId?: string;
}): Promise<{ sent: boolean; skippedDuplicate?: boolean; error?: string }> {
  const smtp = getSmtpConfig();
  if (!smtp.ok) {
    await recordEvent({
      domain: 'system',
      severity: 'warning',
      action: 'notify.email_not_configured',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: params.orderId || 'none',
      message: `Skipped ${params.template} email to ${params.to} — ${smtp.error}`,
      metadata: { template: params.template, missing: smtp.missing },
    });
    return { sent: false, error: smtp.error };
  }

  if (params.orderId) {
    const dup = await alreadySent(params.orderId, params.template);
    if (dup) {
      return { sent: true, skippedDuplicate: true };
    }
  }

  try {
    const mailer: SendMailer =
      testMailer ??
      nodemailer.createTransport({
        host: smtp.config.host,
        port: smtp.config.port,
        secure: smtp.config.secure,
        auth: { user: smtp.config.user, pass: smtp.config.password },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });

    const info = await mailer.sendMail({
      from: smtp.config.from,
      to: params.to,
      subject: EMAIL_SUBJECT[params.template],
      html: params.html,
      text: params.text,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
    if (accepted < 1) {
      const error = 'SMTP accepted no recipients';
      await reportError('transactional email failed', { error, template: params.template });
      return { sent: false, error };
    }

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: `notify.${params.template}`,
      actorId: 'system',
      resourceType: 'orders',
      resourceId: params.orderId || 'none',
      message: `Sent ${params.template} to ${params.to}`,
      metadata: { template: params.template },
    });
    return { sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'email send failed';
    await reportError('transactional email exception', { error, template: params.template });
    return { sent: false, error };
  }
}
