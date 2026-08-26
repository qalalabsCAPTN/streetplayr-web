/**
 * Provider-agnostic SMTP config. Gmail is the first provider:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465   (SSL) or 587 (STARTTLS)
 *   SMTP_USER=...
 *   SMTP_PASSWORD=...   (Gmail app password)
 *   TRANSACTIONAL_FROM_EMAIL=StreetPlayR <you@gmail.com>
 *
 * Credentials are never hardcoded. Missing config = not configured.
 */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

const REQUIRED = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'TRANSACTIONAL_FROM_EMAIL'] as const;

export type SmtpConfigResult =
  | { ok: true; config: SmtpConfig }
  | { ok: false; error: string; missing: string[] };

export function getSmtpConfig(): SmtpConfigResult {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Email delivery is not configured (${missing.join(', ')}).`,
      missing: [...missing],
    };
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT!.trim());
  const user = process.env.SMTP_USER!.trim();
  const password = process.env.SMTP_PASSWORD!.trim();
  const from = process.env.TRANSACTIONAL_FROM_EMAIL!.trim();

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'SMTP_PORT is INVALID.', missing: [] };
  }
  if (!from.includes('@')) {
    return { ok: false, error: 'TRANSACTIONAL_FROM_EMAIL is INVALID.', missing: [] };
  }

  return {
    ok: true,
    config: {
      host,
      port,
      secure: port === 465,
      user,
      password,
      from,
    },
  };
}
