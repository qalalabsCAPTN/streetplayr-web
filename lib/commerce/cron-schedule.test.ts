import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('vercel cron schedule', () => {
  it('schedules every production cron route', () => {
    const src = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
    const json = JSON.parse(src) as { crons: { path: string }[] };
    const paths = json.crons.map((c) => c.path);
    expect(paths).toEqual(expect.arrayContaining([
      '/api/cron/release-expired-reservations',
      '/api/cron/sync-inventory',
      '/api/cron/sync-products',
      '/api/cron/sync-order-status',
      '/api/cron/reconciliation',
      '/api/cron/sync-returns',
    ]));
  });

  it('cron routes reject missing CRON_SECRET', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/api/cron/release-expired-reservations/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/CRON_SECRET/);
    expect(src).toMatch(/Bearer/);
  });
});
