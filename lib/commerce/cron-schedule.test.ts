import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Vercel cron schedule', () => {
  it('schedules Uniware inventory sync once daily on Vercel Hobby', () => {
    const src = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
    const json = JSON.parse(src) as { crons?: Array<{ path: string; schedule: string }> };
    expect(json.crons).toEqual([
      { path: '/api/cron/sync-inventory', schedule: '0 3 * * *' },
    ]);
  });

  it('job routes still reject missing CRON_SECRET for GCR invoke', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/api/cron/release-expired-reservations/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/CRON_SECRET/);
    expect(src).toMatch(/Bearer/);
  });
});
