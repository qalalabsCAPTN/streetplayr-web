/**
 * Safe Easebuzz credential/endpoint diagnostic — never prints key/salt.
 * Usage: npx tsx scripts/easebuzz-credential-diagnostic.ts
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local missing');
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function analyzeSecret(label: string, raw: string | undefined) {
  if (raw === undefined) {
    console.log(`${label}: UNDEFINED`);
    return null;
  }
  const trimmed = raw.trim();
  console.log(`${label}:`);
  console.log(`  defined: yes`);
  console.log(`  rawLength: ${raw.length}`);
  console.log(`  trimmedLength: ${trimmed.length}`);
  console.log(`  hasLeadingWhitespace: ${raw.length !== raw.trimStart().length}`);
  console.log(`  hasTrailingWhitespace: ${raw.length !== raw.trimEnd().length}`);
  console.log(`  hasNewline: ${/[\r\n]/.test(raw)}`);
  console.log(`  hasBOM: ${raw.charCodeAt(0) === 0xfeff}`);
  console.log(`  isAlphanumericOnly: ${/^[a-zA-Z0-9]+$/.test(trimmed)}`);
  return trimmed;
}

async function probeInitiate(host: string, key: string, salt: string) {
  const txnid = `DIAG${Date.now().toString(36)}`.slice(0, 40);
  const amount = '1.00';
  const productinfo = 'diag';
  const firstname = 'Diag';
  const email = 'diag@example.com';
  const phone = '9999999999';
  const surl = 'https://example.com/s';
  const furl = 'https://example.com/f';
  const udf1 = '';

  const hashSeq =
    `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}||||||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashSeq).digest('hex');

  const body = new URLSearchParams({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
    hash,
  });

  const url = `${host}/payment/initiateLink`;
  console.log(`\nPROBE ${host}`);
  console.log(`  method: POST`);
  console.log(`  contentType: application/x-www-form-urlencoded`);
  console.log(`  paramNames: ${[...body.keys()].join(',')}`);
  console.log(`  endpoint: ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    console.log(`  httpStatus: ${res.status}`);
    console.log(
      `  responseKeys: ${json ? Object.keys(json).join(',') : 'non-json'}`
    );
    console.log(`  easebuzzStatus: ${json?.status ?? 'n/a'}`);
    // Never print access keys (data) or secrets — only error_desc on failure
    if (json?.status === 1) {
      console.log(`  error_desc: (none — initiation succeeded, access key withheld)`);
    } else {
      console.log(`  error_desc: ${json?.error_desc ?? '(none)'}`);
    }
    console.log(`  merchantKeyAccepted: ${json?.status === 1 ? 'YES' : 'NO'}`);
    return json;
  } catch (e: any) {
    console.log(`  fetchError: ${e?.name || 'error'}`);
    return null;
  }
}

async function main() {
  loadEnvLocal();

  console.log('=== EASEBUZZ CREDENTIAL DIAGNOSTIC (sanitized) ===\n');
  console.log(`EASEBUZZ_ENV raw: ${process.env.EASEBUZZ_ENV ?? 'unset'}`);
  console.log(
    `Resolved env: ${process.env.EASEBUZZ_ENV === 'prod' ? 'prod' : 'test'}`
  );
  console.log(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'unset'}`);

  const key = analyzeSecret('EASEBUZZ_MERCHANT_KEY', process.env.EASEBUZZ_MERCHANT_KEY);
  const salt = analyzeSecret('EASEBUZZ_SALT', process.env.EASEBUZZ_SALT);

  if (!key || !salt) {
    console.log('\nRESULT: credentials missing — cannot probe API');
    process.exit(1);
  }

  // Probe BOTH hosts with the same credentials to classify A/B/C
  const sandbox = await probeInitiate('https://testpay.easebuzz.in', key, salt);
  const live = await probeInitiate('https://pay.easebuzz.in', key, salt);

  console.log('\n=== CLASSIFICATION ===');
  const sandboxOk = sandbox?.status === 1;
  const liveOk = live?.status === 1;
  const sandboxMsg = String(sandbox?.error_desc || sandbox?.data || '').toLowerCase();
  const liveMsg = String(live?.error_desc || live?.data || '').toLowerCase();

  if (sandboxOk) {
    console.log('A/B/C: Key works on SANDBOX — credentials OK for test');
  } else if (liveOk && !sandboxOk) {
    console.log('CLASSIFICATION: B — LIVE key accepted on production host, rejected on sandbox');
    console.log('ACTION: Use sandbox Merchant Key/Salt from Easebuzz TEST dashboard, not live keys');
  } else if (!liveOk && sandboxOk === false && sandboxMsg.includes('merchant key')) {
    if (liveMsg.includes('merchant key')) {
      console.log('CLASSIFICATION: A or H or I — Merchant Key rejected on BOTH hosts');
      console.log('Likely: wrong key, key from another account, or sandbox API not activated');
    } else {
      console.log('CLASSIFICATION: A/H — rejected on sandbox; production response differed');
      console.log(`  live error (sanitized): ${live?.error_desc || live?.data || 'n/a'}`);
    }
  } else {
    console.log('CLASSIFICATION: inconclusive — inspect error_desc above');
  }

  console.log('\nOfficial contract used for probe:');
  console.log('  source: easebuzz/paywitheasebuzz-php-lib easebuzz-lib/utils.php');
  console.log('  endpoint: {testpay|pay}.easebuzz.in/payment/initiateLink');
  console.log('  param name for merchant key: key');
  console.log('  hash: key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
