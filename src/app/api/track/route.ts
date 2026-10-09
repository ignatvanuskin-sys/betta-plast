/**
 * Event collector (§8.6). Accepts `sendBeacon` payloads, so it must be cheap,
 * tolerant of malformed bodies and must never throw a 500 into the browser.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { trackEvent } from '@/lib/domain/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'lead_submit',
  'calc_start',
  'calc_complete',
  'measure_request',
  'repair_request',
  'whatsapp_click',
  'call_click',
  'email_click',
  'map_click',
  'gallery_open',
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      path?: string;
      sessionId?: string;
      props?: Record<string, unknown>;
    };
    const name = typeof body.name === 'string' ? body.name : '';
    if (!ALLOWED_EVENTS.has(name)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await trackEvent({
      name,
      path: body.path ?? null,
      sessionId: body.sessionId ?? null,
      props: body.props ?? null,
    });
  } catch {
    // Analytics is best-effort by design.
  }
  return NextResponse.json({ ok: true });
}
