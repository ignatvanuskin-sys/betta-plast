/**
 * Protected cron endpoints (§12). Every job is a plain HTTPS GET so any
 * scheduler works: Vercel Cron, Supabase Cron, cron-job.org or a system crontab.
 *
 *   GET /api/cron/outbox            every minute
 *   GET /api/cron/sla               every 5 minutes
 *   GET /api/cron/measure-reminders hourly
 *   GET /api/cron/review-requests   daily
 *   GET /api/cron/digest            daily 09:00 Asia/Almaty
 *   GET /api/cron/housekeeping      daily
 */
import { NextResponse, type NextRequest } from 'next/server';

import { cron } from '@/lib/config';
import {
  processOutbox,
  runHousekeeping,
  runMeasurementReminders,
  runReviewRequestReminders,
  runSlaCheck,
  sendMorningDigest,
} from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOBS: Record<string, () => Promise<unknown>> = {
  outbox: () => processOutbox(30),
  sla: runSlaCheck,
  'measure-reminders': () => runMeasurementReminders(),
  'review-requests': () => runReviewRequestReminders(),
  digest: () => sendMorningDigest(),
  housekeeping: runHousekeeping,
};

function authorised(request: NextRequest): boolean {
  if (!cron.secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (request.nextUrl.searchParams.get('token') ?? '');
  return token === cron.secret;
}

export async function GET(request: NextRequest, context: { params: Promise<{ job: string }> }) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { job } = await context.params;
  const handler = JOBS[job];
  if (!handler) {
    return NextResponse.json({ ok: false, message: `Unknown job: ${job}` }, { status: 404 });
  }

  try {
    const result = await handler();
    return NextResponse.json({ ok: true, job, result });
  } catch (error) {
    console.error(`[cron] ${job} failed`, error);
    return NextResponse.json(
      { ok: false, job, message: error instanceof Error ? error.message : 'failed' },
      { status: 500 },
    );
  }
}
