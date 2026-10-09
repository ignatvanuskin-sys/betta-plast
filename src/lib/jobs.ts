/**
 * Scheduled work (§8.3/§8.4/§8.5/§16.7), triggered by protected cron endpoints.
 * All logic lives here so it can also be run manually from the admin panel.
 */
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

import { flags, telegram } from './config';
import { getDb } from './db/client';
import { leads, measurements, notificationJobs, settings } from './db/schema';
import { cleanupRateLimits } from './domain/ratelimit';
import { findUnansweredLeads } from './domain/leads';
import { formatDateTimeRu, isWithinWorkingHours, localDayKey, zonedDateTime } from './domain/time';
import { enqueue, processOutbox } from './notify/outbox';
import { waTemplates } from './notify/messages';

const REVIEW_DELAY_DAYS_DEFAULT = 2;
const REVIEW_DELAY_SETTING = 'review_request_delay_days';

/* -------------------------------------------------------------------------- */
/* SLA escalation                                                             */
/* -------------------------------------------------------------------------- */

export type SlaResult = { checked: number; escalated: number; deferred: number };

/**
 * A lead nobody took within SLA_FIRST_RESPONSE_MINUTES is re-sent with an
 * escalation message addressed to the owner. Outside working hours the
 * notification is silent and an answer is prepared for the morning digest.
 */
export async function runSlaCheck(): Promise<SlaResult> {
  const overdue = await findUnansweredLeads(flags.slaFirstResponseMinutes);
  const workingHours = isWithinWorkingHours();
  const result: SlaResult = { checked: overdue.length, escalated: 0, deferred: 0 };

  for (const lead of overdue) {
    if (!workingHours.open) {
      // Quiet escalation: keep it in the lead's own chat but do not buzz anyone.
      if (telegram.enabled && telegram.leadsChatId) {
        await enqueue({
          dedupeKey: `sla:quiet:${lead.id}:${localDayKey()}`,
          leadId: lead.id,
          payload: {
            kind: 'telegram',
            chatId: telegram.leadsChatId,
            text: `⏳ Заявка #${lead.id} без ответа (${workingHours.reason}). Ответить нужно утром.`,
            disableNotification: true,
          },
        });
      }
      result.deferred += 1;
      continue;
    }

    const target = telegram.ownerId || telegram.leadsChatId;
    if (telegram.enabled && target) {
      await enqueue({
        dedupeKey: `sla:escalation:${lead.id}`,
        leadId: lead.id,
        payload: {
          kind: 'telegram',
          chatId: target,
          text: `🚨 Заявка #${lead.id} не взята в работу более ${flags.slaFirstResponseMinutes} мин.\n${lead.name}, ${lead.phoneNormalized}`,
        },
      });
      result.escalated += 1;
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Morning digest                                                             */
/* -------------------------------------------------------------------------- */

export async function sendMorningDigest(dayKey = localDayKey()): Promise<{ queued: boolean }> {
  const db = await getDb();
  const from = zonedDateTime(dayKey, 0);
  const to = zonedDateTime(dayKey, 24 * 60 - 1);

  const todayLeads = await db
    .select()
    .from(leads)
    .where(and(gte(leads.createdAt, from), lte(leads.createdAt, to)));
  const upcoming = await db
    .select()
    .from(measurements)
    .where(and(inArray(measurements.status, ['pending', 'confirmed']), gte(measurements.startsAt, from), lte(measurements.startsAt, to)));
  const unanswered = await findUnansweredLeads(0);

  const target = telegram.ownerId || telegram.leadsChatId;
  if (!telegram.enabled || !target) return { queued: false };

  const text = [
    `☀️ Сводка на ${dayKey.split('-').reverse().join('.')}`,
    `Новых заявок: ${todayLeads.length}`,
    `Замеров на сегодня: ${upcoming.length}`,
    `Без ответа: ${unanswered.length}`,
    '',
    upcoming.length
      ? 'Замеры:\n' +
        upcoming
          .map((row) => `• ${formatDateTimeRu(row.startsAt)} — ${row.address || 'адрес уточняется'}`)
          .join('\n')
      : 'Замеров на сегодня нет.',
  ].join('\n');

  await enqueue({ dedupeKey: `digest:${dayKey}`, payload: { kind: 'telegram', chatId: target, text } });
  return { queued: true };
}

/* -------------------------------------------------------------------------- */
/* Measurement reminders                                                      */
/* -------------------------------------------------------------------------- */

/** Reminder to the manager/measurer the evening before and two hours ahead. */
export async function runMeasurementReminders(now: Date = new Date()): Promise<{ queued: number }> {
  if (!telegram.enabled || !telegram.leadsChatId) return { queued: 0 };
  const db = await getDb();

  const tomorrowKey = localDayKey(new Date(now.getTime() + 86_400_000));
  const from = zonedDateTime(tomorrowKey, 0);
  const to = zonedDateTime(tomorrowKey, 24 * 60 - 1);

  const rows = await db
    .select()
    .from(measurements)
    .where(and(inArray(measurements.status, ['pending', 'confirmed']), gte(measurements.startsAt, from), lte(measurements.startsAt, to)));

  let queued = 0;
  for (const row of rows) {
    const inserted = await enqueue({
      dedupeKey: `measure:${row.id}:day-before:${tomorrowKey}`,
      leadId: row.leadId,
      payload: {
        kind: 'telegram',
        chatId: telegram.leadsChatId,
        text: `📅 Завтра замер в ${formatDateTimeRu(row.startsAt).split(', ')[1] ?? ''}${row.address ? `, ${row.address}` : ''}${row.status === 'pending' ? ' — запись ещё не подтверждена!' : ''}`,
      },
    });
    if (inserted) queued += 1;
  }

  // Two-hour reminder.
  const soonFrom = new Date(now.getTime() + 105 * 60_000);
  const soonTo = new Date(now.getTime() + 135 * 60_000);
  const soon = await db
    .select()
    .from(measurements)
    .where(and(inArray(measurements.status, ['pending', 'confirmed']), gte(measurements.startsAt, soonFrom), lte(measurements.startsAt, soonTo)));

  for (const row of soon) {
    const inserted = await enqueue({
      dedupeKey: `measure:${row.id}:two-hours`,
      leadId: row.leadId,
      payload: {
        kind: 'telegram',
        chatId: telegram.leadsChatId,
        text: `⏰ Через 2 часа замер: ${formatDateTimeRu(row.startsAt)}${row.address ? `, ${row.address}` : ''}`,
      },
    });
    if (inserted) queued += 1;
  }

  return { queued };
}

/* -------------------------------------------------------------------------- */
/* Review requests                                                            */
/* -------------------------------------------------------------------------- */

/**
 * After installation, the manager gets a reminder with a ready WhatsApp text.
 * The bot never contacts the client directly (§8.5).
 */
export async function runReviewRequestReminders(now: Date = new Date()): Promise<{ queued: number }> {
  const db = await getDb();
  const delaySetting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, REVIEW_DELAY_SETTING))
    .limit(1);
  const delayDays = Number(delaySetting[0]?.value ?? REVIEW_DELAY_DAYS_DEFAULT) || REVIEW_DELAY_DAYS_DEFAULT;

  const cutoff = new Date(now.getTime() - delayDays * 86_400_000);
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.status, 'installed'), isNull(leads.reviewRequestedAt), lte(leads.updatedAt, cutoff)));

  let queued = 0;
  for (const lead of rows) {
    if (!telegram.enabled || !telegram.leadsChatId) break;
    const text = waTemplates.reviewRequest({ name: lead.name });
    const inserted = await enqueue({
      dedupeKey: `review:${lead.id}:${localDayKey(now)}`,
      leadId: lead.id,
      payload: {
        kind: 'telegram',
        chatId: telegram.leadsChatId,
        text: [
          `⭐ Заявка #${lead.id} (${lead.name}) смонтирована ${delayDays} дн. назад.`,
          'Попросите клиента оставить отзыв в 2ГИС — отправьте сообщение вручную:',
          '',
          text,
        ].join('\n'),
      },
    });
    if (inserted) queued += 1;
  }

  return { queued };
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                               */
/* -------------------------------------------------------------------------- */

export async function runHousekeeping(): Promise<{ purged: number }> {
  const db = await getDb();
  const removed = await db
    .delete(notificationJobs)
    .where(and(eq(notificationJobs.status, 'sent'), lte(notificationJobs.sentAt, new Date(Date.now() - 30 * 86_400_000))))
    .returning({ id: notificationJobs.id });
  await cleanupRateLimits();
  return { purged: removed.length };
}

export { processOutbox };
