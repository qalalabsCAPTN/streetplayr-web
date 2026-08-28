import { describe, expect, it } from 'vitest';
import {
  allowedAppOrigin,
  emailConfirmEmail,
  passwordResetEmail,
  recoveryRedirectUrl,
  signupConfirmUrl,
  signupRedirectUrl,
} from './password-reset';

describe('recoveryRedirectUrl', () => {
  it('allows streetplayr hosts and local', () => {
    expect(recoveryRedirectUrl('https://www.streetplayr.com/forgot-password')).toBe(
      'https://www.streetplayr.com/reset-password'
    );
    expect(recoveryRedirectUrl('https://streetplayr.com')).toBe('https://streetplayr.com/reset-password');
    expect(recoveryRedirectUrl('http://localhost:3000/forgot-password')).toBe(
      'http://localhost:3000/reset-password'
    );
  });

  it('rejects open redirects', () => {
    expect(recoveryRedirectUrl('https://evil.example/reset')).toBeNull();
    expect(recoveryRedirectUrl('not-a-url')).toBeNull();
  });
});

describe('signup confirmation URLs', () => {
  it('allows streetplayr hosts and local', () => {
    expect(signupRedirectUrl('https://www.streetplayr.com/create-account')).toBe(
      'https://www.streetplayr.com/auth/callback?next=/profile'
    );
    expect(signupRedirectUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback?next=/profile'
    );
    expect(allowedAppOrigin('https://streetplayr.com')).toBe('https://streetplayr.com');
  });

  it('rejects open redirects', () => {
    expect(signupRedirectUrl('https://evil.example')).toBeNull();
    expect(signupConfirmUrl('https://evil.example', 'token')).toBeNull();
  });

  it('builds a token_hash callback on our origin', () => {
    expect(signupConfirmUrl('https://www.streetplayr.com/create-account', 'abc.def')).toBe(
      'https://www.streetplayr.com/auth/callback?token_hash=abc.def&type=signup&next=%2Fprofile'
    );
  });
});

describe('passwordResetEmail', () => {
  it('includes the recovery link', () => {
    const mail = passwordResetEmail('https://www.streetplayr.com/reset-password?code=abc');
    expect(mail.html).toContain('https://www.streetplayr.com/reset-password?code=abc');
    expect(mail.text).toContain('https://www.streetplayr.com/reset-password?code=abc');
  });
});

describe('emailConfirmEmail', () => {
  it('includes the activation link', () => {
    const link = 'https://www.streetplayr.com/auth/callback?token_hash=abc&type=signup&next=%2Fprofile';
    const mail = emailConfirmEmail(link);
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
    expect(mail.html).toContain('Activate account');
  });
});

describe('recoveryRedirectUrl', () => {
  it('allows streetplayr hosts and local', () => {
    expect(recoveryRedirectUrl('https://www.streetplayr.com/forgot-password')).toBe(
      'https://www.streetplayr.com/reset-password'
    );
    expect(recoveryRedirectUrl('https://streetplayr.com')).toBe('https://streetplayr.com/reset-password');
    expect(recoveryRedirectUrl('http://localhost:3000/forgot-password')).toBe(
      'http://localhost:3000/reset-password'
    );
  });

  it('rejects open redirects', () => {
    expect(recoveryRedirectUrl('https://evil.example/reset')).toBeNull();
    expect(recoveryRedirectUrl('not-a-url')).toBeNull();
  });
});

describe('passwordResetEmail', () => {
  it('includes the recovery link', () => {
    const mail = passwordResetEmail('https://www.streetplayr.com/reset-password?code=abc');
    expect(mail.html).toContain('https://www.streetplayr.com/reset-password?code=abc');
    expect(mail.text).toContain('https://www.streetplayr.com/reset-password?code=abc');
  });
});
