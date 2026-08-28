/** Auth emails via app SMTP + Supabase admin generateLink. */

const ALLOWED_HOSTS = new Set(['streetplayr.com', 'www.streetplayr.com', 'localhost']);

export function allowedAppOrigin(requested: string): string | null {
  try {
    const url = new URL(requested);
    const host = url.hostname.toLowerCase();
    const allowed =
      ALLOWED_HOSTS.has(host)
      || host.endsWith('.vercel.app')
      || (host === '127.0.0.1' && url.port !== '');
    if (!allowed) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function recoveryRedirectUrl(requested: string): string | null {
  const origin = allowedAppOrigin(requested);
  return origin ? `${origin}/reset-password` : null;
}

export function signupRedirectUrl(requested: string): string | null {
  const origin = allowedAppOrigin(requested);
  return origin ? `${origin}/auth/callback?next=/profile` : null;
}

export function signupConfirmUrl(origin: string, hashedToken: string, type = 'signup'): string | null {
  const allowed = allowedAppOrigin(origin);
  const token = hashedToken.trim();
  if (!allowed || !token || token.length > 2048) return null;
  if (!/^[a-z_]+$/.test(type) || type.length > 32) return null;
  const u = new URL('/auth/callback', allowed);
  u.searchParams.set('token_hash', token);
  u.searchParams.set('type', type);
  u.searchParams.set('next', '/profile');
  return u.toString();
}

function safeHref(link: string): string {
  return link.replace(/"/g, '&quot;');
}

export function passwordResetEmail(link: string): { html: string; text: string } {
  const safe = safeHref(link);
  return {
    html: `<div style="font-family:Inter,sans-serif;color:#16111b">
  <h1 style="font-family:Anton,sans-serif">Reset your password</h1>
  <p>Use this link to set a new StreetPlayR password. It expires soon.</p>
  <p><a href="${safe}">Reset password</a></p>
  <p>If you did not ask for this, ignore the email.</p>
  <p>— StreetPlayR</p>
</div>`,
    text: `Reset your StreetPlayR password:\n${link}\n\nIf you did not ask for this, ignore the email.`,
  };
}

export function emailConfirmEmail(link: string): { html: string; text: string } {
  const safe = safeHref(link);
  return {
    html: `<div style="font-family:Inter,sans-serif;color:#16111b">
  <h1 style="font-family:Anton,sans-serif">Confirm your email</h1>
  <p>Tap the link to activate your StreetPlayR account. It expires soon.</p>
  <p><a href="${safe}">Activate account</a></p>
  <p>If you did not create this account, ignore the email.</p>
  <p>— StreetPlayR</p>
</div>`,
    text: `Activate your StreetPlayR account:\n${link}\n\nIf you did not create this account, ignore the email.`,
  };
}
