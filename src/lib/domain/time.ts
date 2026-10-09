/**
 * Time helpers. Business times are always handled in the site timezone
 * (Asia/Almaty by default); storage is UTC.
 */
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

import { defaultWorkingHours, site } from '../config';

export const TZ = site.timezone;

export function nowUtc(): Date {
  return new Date();
}

/** Formats a UTC instant for humans, e.g. «09.10.2026, 14:35». */
export function formatDateTimeRu(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return formatInTimeZone(value, TZ, 'dd.MM.yyyy, HH:mm');
}

export function formatDateRu(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return formatInTimeZone(value, TZ, 'dd.MM.yyyy');
}

export function formatTimeRu(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return formatInTimeZone(value, TZ, 'HH:mm');
}

/** `YYYY-MM-DD` of an instant, as seen in the site timezone. */
export function localDayKey(date: Date = new Date()): string {
  return formatInTimeZone(date, TZ, 'yyyy-MM-dd');
}

/** Local weekday (0 = Sunday) of an instant in the site timezone. */
export function localWeekday(date: Date): number {
  return Number.parseInt(formatInTimeZone(date, TZ, 'i'), 10) % 7;
}

/** Minutes from local midnight of an instant. */
export function localMinutes(date: Date): number {
  const hh = Number.parseInt(formatInTimeZone(date, TZ, 'HH'), 10);
  const mm = Number.parseInt(formatInTimeZone(date, TZ, 'mm'), 10);
  return hh * 60 + mm;
}

/** Builds a UTC instant from a local calendar day and minutes-from-midnight. */
export function zonedDateTime(dayKey: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return fromZonedTime(`${dayKey}T${hh}:${mm}:00`, TZ);
}

/** A `Date` whose local getters already reflect the site timezone. */
export function toLocal(date: Date): Date {
  return toZonedTime(date, TZ);
}

export type WorkingHoursResult = { open: boolean; reason: string };

/**
 * Working-hours check used by the SLA escalation. Only the Friday schedule is
 * documented in the 2GIS card, so the default table is a conservative
 * assumption until `working_hours_week` is confirmed by the owner.
 */
export function isWithinWorkingHours(date: Date = new Date()): WorkingHoursResult {
  const weekday = localWeekday(date);
  const minutes = localMinutes(date);
  const rule = defaultWorkingHours.schedule.find((entry) => entry.weekday === weekday);
  if (!rule || !rule.enabled) return { open: false, reason: 'выходной' };
  if (minutes < rule.startMinute || minutes >= rule.endMinute) return { open: false, reason: 'вне рабочих часов' };
  if (minutes >= defaultWorkingHours.lunchStartMinute && minutes < defaultWorkingHours.lunchEndMinute) {
    return { open: false, reason: 'обед' };
  }
  return { open: true, reason: '' };
}

export function minutesSince(date: Date, from: Date = new Date()): number {
  return Math.floor((from.getTime() - date.getTime()) / 60_000);
}
