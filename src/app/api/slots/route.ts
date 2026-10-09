/**
 * Available measurement slots (§8.3). Read-only and cheap: the booking form
 * asks for one day at a time, so the payload stays small on mobile.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { BOOKING_HORIZON_DAYS, getAvailableSlots } from '@/lib/domain/slots';
import { localDayKey } from '@/lib/domain/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('day') ?? localDayKey();
  if (!DAY_PATTERN.test(requested)) {
    return NextResponse.json({ ok: false, message: 'Неверный формат даты' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(requested);
    return NextResponse.json({
      ok: true,
      day: requested,
      horizonDays: BOOKING_HORIZON_DAYS,
      slots: slots.map((slot) => ({ startsAt: slot.startsAt, label: slot.label })),
    });
  } catch (error) {
    console.error('[slots] failed', error);
    return NextResponse.json({ ok: false, message: 'Не удалось получить свободное время' }, { status: 500 });
  }
}
