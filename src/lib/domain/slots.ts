/**
 * Measurement booking (§8.3).
 *
 * Slots are derived from `measurement_rules` (weekday, working window, slot
 * length, capacity), minus `blackout_dates` and already-booked measurements.
 * A booking is a *request* (`pending`) until a manager confirms it.
 */
import { and, eq, gte, inArray, lt, lte } from 'drizzle-orm';
import { addDays } from 'date-fns';

import { defaultWorkingHours, site } from '../config';
import { getDb } from '../db/client';
import { blackoutDates, leadEvents, leads, measurementRules, measurements } from '../db/schema';
import { localDayKey, zonedDateTime, formatDateTimeRu } from './time';

export const DEFAULT_SLOT_MINUTES = 60;
export const DEFAULT_CAPACITY = 1;
export const MIN_LEAD_TIME_MINUTES = 120;
export const BOOKING_HORIZON_DAYS = 14;

export type SlotRule = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  capacity: number;
  enabled: boolean;
};

export type Slot = {
  startsAt: string; // ISO UTC
  endsAt: string;
  label: string; // local HH:mm
  remaining: number;
};

function defaultRules(): SlotRule[] {
  return defaultWorkingHours.schedule.map((entry) => ({
    weekday: entry.weekday,
    startMinute: entry.startMinute,
    endMinute: entry.endMinute,
    slotMinutes: DEFAULT_SLOT_MINUTES,
    capacity: DEFAULT_CAPACITY,
    enabled: entry.enabled,
  }));
}

export async function getSlotRules(): Promise<SlotRule[]> {
  const db = await getDb();
  const rows = await db.select().from(measurementRules);
  if (rows.length === 0) return defaultRules();
  return rows.map((row) => ({
    weekday: row.weekday,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    slotMinutes: row.slotMinutes,
    capacity: row.capacity,
    enabled: row.enabled,
  }));
}

export async function isBlackout(dayKey: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select().from(blackoutDates).where(eq(blackoutDates.day, dayKey)).limit(1);
  return rows.length > 0;
}

/**
 * Builds the bookable slots for one local calendar day.
 * Returns an empty list for days outside the booking horizon, blackout dates
 * and non-working weekdays.
 */
export async function getAvailableSlots(dayKey: string, now: Date = new Date()): Promise<Slot[]> {
  const db = await getDb();
  const todayKey = localDayKey(now);
  const horizonKey = localDayKey(addDays(now, BOOKING_HORIZON_DAYS));

  if (dayKey < todayKey) return []; // no past
  if (dayKey > horizonKey) return [];
  if (await isBlackout(dayKey)) return [];

  const rules = await getSlotRules();
  const [y, m, d] = dayKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  const rule = rules.find((entry) => entry.weekday === weekday);
  if (!rule || !rule.enabled) return [];

  const dayStart = zonedDateTime(dayKey, 0);
  const dayEnd = zonedDateTime(dayKey, 24 * 60 - 1);
  const booked = await db
    .select({ startsAt: measurements.startsAt, endsAt: measurements.endsAt })
    .from(measurements)
    .where(
      and(
        inArray(measurements.status, ['pending', 'confirmed']),
        gte(measurements.startsAt, dayStart),
        lte(measurements.startsAt, dayEnd),
      ),
    );

  const slots: Slot[] = [];
  const minimum = new Date(now.getTime() + MIN_LEAD_TIME_MINUTES * 60_000);

  for (let minute = rule.startMinute; minute + rule.slotMinutes <= rule.endMinute; minute += rule.slotMinutes) {
    const endsAtMinute = minute + rule.slotMinutes;
    // Skip slots that fall inside the lunch break.
    if (minute < defaultWorkingHours.lunchEndMinute && endsAtMinute > defaultWorkingHours.lunchStartMinute) continue;

    const startsAt = zonedDateTime(dayKey, minute);
    if (startsAt < minimum) continue;

    const endsAt = zonedDateTime(dayKey, endsAtMinute);
    const used = booked.filter((row) => row.startsAt < endsAt && row.endsAt > startsAt).length;
    const remaining = rule.capacity - used;
    if (remaining <= 0) continue;

    slots.push({
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      label: formatDateTimeRu(startsAt).split(', ')[1] ?? '',
      remaining,
    });
  }

  return slots;
}

export type BookMeasurementInput = {
  leadId: number;
  startsAt: Date;
  address?: string;
  district?: string | null;
  notes?: string;
  actor: string;
};

export class SlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlotError';
  }
}

/** Books a slot as a request. Re-validates capacity server-side. */
export async function requestMeasurement(input: BookMeasurementInput): Promise<{ id: number }> {
  const db = await getDb();
  const dayKey = localDayKey(input.startsAt);

  if (input.startsAt < new Date()) throw new SlotError('Нельзя выбрать прошедшую дату');

  const slots = await getAvailableSlots(dayKey);
  const requested = input.startsAt.toISOString();
  const slot = slots.find((entry) => entry.startsAt === requested);
  if (!slot) {
    // Fall back to a capacity re-check so a race does not oversubscribe.
    const rules = await getSlotRules();
    const [y, m, d] = dayKey.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
    const rule = rules.find((entry) => entry.weekday === weekday);
    if (!rule?.enabled) throw new SlotError('В этот день замеры не проводятся — выберите другой день');
    if (await isBlackout(dayKey)) throw new SlotError('Этот день закрыт — выберите другой');
  }

  const endsAt = new Date(input.startsAt.getTime() + DEFAULT_SLOT_MINUTES * 60_000);

  const overlapping = await db
    .select({ id: measurements.id })
    .from(measurements)
    .where(
      and(
        inArray(measurements.status, ['pending', 'confirmed']),
        lt(measurements.startsAt, endsAt),
        gte(measurements.endsAt, input.startsAt),
      ),
    );
  if (overlapping.length >= DEFAULT_CAPACITY) {
    throw new SlotError('Это время уже занято — выберите другое');
  }

  const inserted = await db
    .insert(measurements)
    .values({
      leadId: input.leadId,
      startsAt: input.startsAt,
      endsAt,
      address: input.address ?? '',
      district: input.district ?? null,
      status: 'pending',
      notes: input.notes ?? null,
    })
    .returning({ id: measurements.id });

  const measurement = inserted[0];
  if (!measurement) throw new SlotError('Не удалось создать запись на замер');

  await db.insert(leadEvents).values({
    leadId: input.leadId,
    type: 'status_changed',
    toStatus: 'measure_booked',
    actorType: 'user',
    actorName: input.actor,
    channel: 'admin',
    meta: { measurementId: measurement.id, startsAt: input.startsAt.toISOString() },
  });
  await db.update(leads).set({ status: 'measure_booked', updatedAt: new Date() }).where(eq(leads.id, input.leadId));

  return { id: measurement.id };
}

export async function setMeasurementStatus(
  id: number,
  status: 'pending' | 'confirmed' | 'done' | 'cancelled',
  actor: string,
): Promise<void> {
  const db = await getDb();
  await db.update(measurements).set({ status, updatedAt: new Date() }).where(eq(measurements.id, id));
  const rows = await db.select().from(measurements).where(eq(measurements.id, id)).limit(1);
  const measurement = rows[0];
  if (!measurement) return;

  await db.insert(leadEvents).values({
    leadId: measurement.leadId,
    type: 'note',
    actorType: 'user',
    actorName: actor,
    channel: 'admin',
    meta: { measurementId: id, measurementStatus: status },
  });
}

export async function listUpcomingMeasurements(limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(measurements)
    .where(and(inArray(measurements.status, ['pending', 'confirmed']), gte(measurements.startsAt, new Date())))
    .orderBy(measurements.startsAt)
    .limit(limit);
}

export async function listMeasurementsForDay(dayKey: string) {
  const db = await getDb();
  const from = zonedDateTime(dayKey, 0);
  const to = zonedDateTime(dayKey, 24 * 60 - 1);
  return db
    .select()
    .from(measurements)
    .where(and(gte(measurements.startsAt, from), lte(measurements.startsAt, to)))
    .orderBy(measurements.startsAt);
}

export const TIMEZONE = site.timezone;
