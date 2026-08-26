import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Vercel cron schedule', () => {
  it('does not schedule crons on Vercel — jobs deferred to GCR', () => {
    const src = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
    const json = JSON.parse(src) as { crons?: unknown };
    expect(json.crons ?? []).toEqual([]);
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
