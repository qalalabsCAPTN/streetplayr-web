/**
 * Live Gmail SMTP check. Never prints SMTP_USER or SMTP_PASSWORD.
 * Usage: npx tsx scripts/smtp-gmail-live-test.ts
 */
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getSmtpConfig } from '../lib/notifications/smtp';
import { EMAIL_SUBJECT, orderEmailHtml } from '../lib/notifications/templates';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function redact(s: string): string {
  const secrets = [process.env.SMTP_PASSWORD, process.env.SMTP_USER].filter(Boolean) as string[];
  let out = s;
  for (const secret of secrets) {
    if (secret.length >= 4) out = out.split(secret).join('[redacted]');
  }
  return out.replace(/pass(?:word)?[=:\s]+[^\s]+/gi, 'pass=[redacted]');
}

function report(key: string, ok: boolean, detail: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${key} | ${redact(detail)}`);
  return ok;
}

async function main() {
  loadEnvLocal();
  let connection = false;
  let testEmail = false;
  let sender = false;

  const saved: Record<string, string | undefined> = {};
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'TRANSACTIONAL_FROM_EMAIL'] as const) {
    saved[k] = process.env[k];
  }
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  const missing = getSmtpConfig();
  const missingOk = !missing.ok && missing.error.includes('not configured');
  report('missing_creds_honest', missingOk, missing.ok ? 'unexpected ok' : 'error_is_configured_gap');
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  const cfg = getSmtpConfig();
  if (!cfg.ok) {
    report('smtp_config', false, cfg.error);
    console.log(`SMTP connection: FAIL`);
    console.log(`Test email: FAIL`);
    console.log(`Sender: FAIL`);
    process.exitCode = 1;
    return;
  }

  const tlsOk = cfg.config.port === 465 && cfg.config.secure === true && cfg.config.host === 'smtp.gmail.com';
  report(
    'tls_465',
    tlsOk,
    `host_set=${Boolean(cfg.config.host)} port=${cfg.config.port} secure=${cfg.config.secure}`
  );

  const to = process.env.SMTP_TEST_TO?.trim();
  if (!to || !to.includes('@')) {
    report('smtp_test_to', false, 'SMTP_TEST_TO missing or invalid');
  }

  const transport = nodemailer.createTransport({
    host: cfg.config.host,
    port: cfg.config.port,
    secure: cfg.config.secure,
    auth: { user: cfg.config.user, pass: cfg.config.password },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  try {
    await transport.verify();
    connection = true;
    report('smtp_verify', true, 'verify_ok');
  } catch (e) {
    report('smtp_verify', false, e instanceof Error ? e.message : 'verify_failed');
  }

  if (connection && to?.includes('@')) {
    try {
      const info = await transport.sendMail({
        from: cfg.config.from,
        to,
        subject: EMAIL_SUBJECT.contact_ack,
        html: orderEmailHtml('SMTP live test', 'StreetPlayR Gmail SMTP connection test.', 'SMTP-TEST'),
        text: 'StreetPlayR Gmail SMTP connection test.',
      });
      const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
      testEmail = accepted >= 1;
      const envelopeFrom = String(info.envelope?.from || cfg.config.from);
      sender = envelopeFrom.includes('@') && cfg.config.from.includes('@') && cfg.config.from === saved.TRANSACTIONAL_FROM_EMAIL?.trim();
      report('send', testEmail, `accepted=${accepted} from_matches_config=${sender}`);
    } catch (e) {
      report('send', false, e instanceof Error ? e.message : 'send_failed');
    }
  }

  console.log(`SMTP connection: ${connection && tlsOk ? 'PASS' : 'FAIL'}`);
  console.log(`Test email: ${testEmail ? 'PASS' : 'FAIL'}`);
  console.log(`Sender: ${sender ? 'PASS' : 'FAIL'}`);
  if (!connection || !tlsOk || !testEmail || !sender) process.exitCode = 1;
}

main().catch((e) => {
  console.error(redact(e instanceof Error ? e.message : 'fatal'));
  process.exit(1);
});
