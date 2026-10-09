/**
 * Transactional outbox (§8.1/§8.4).
 *
 * A lead is written to the database FIRST; notifications are queued as jobs and
 * delivered with retries and increasing backoff. A Telegram outage therefore
 * never loses a lead — the job stays in the queue, the email fallback fires and
 * the admin panel flags the lead.
 */
import { and, asc, eq, lte, sql } from 'drizzle-orm';

import { email, telegram } from '../config';
import { getDb } from '../db/client';
import { notificationJobs } from '../db/schema';
import { emailNotifier } from './email';
import { leadEmailSubject, leadEmailText, leadCardButtons, leadCardText } from './messages';
import { telegramNotifier } from './telegram';
import type { NotificationPayload } from './types';
import { webhookNotifier, leadWebhookUrl } from './webhook';
import type { Lead } from '../db/schema';

/** Increasing backoff between delivery attempts, in seconds. */
export const BACKOFF_SECONDS = [30, 120, 600, 1800, 7200, 21600];
export const MAX_ATTEMPTS = BACKOFF_SECONDS.length;

export type EnqueueInput = {
  payload: NotificationPayload;
  dedupeKey: string;
  leadId?: number;
  /** Small delays let the database transaction settle before the first try. */
  delaySeconds?: number;
};

/** Queues a notification. Duplicate keys are ignored (idempotent). */
export async function enqueue({ payload, dedupeKey, leadId, delaySeconds = 0 }: EnqueueInput): Promise<boolean> {
  const db = await getDb();
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);
  const inserted = await db
    .insert(notificationJobs)
    .values({
      channel: payload.kind,
      dedupeKey,
      payload: payload as unknown as Record<string, unknown>,
      nextAttemptAt,
      leadId: leadId ?? null,
    })
    .onConflictDoNothing({ target: notificationJobs.dedupeKey })
    .returning({ id: notificationJobs.id });
  return inserted.length > 0;
}

/** Queues the standard fan-out for a newly created lead. */
export async function enqueueNewLead(lead: Lead, options: { repeat?: boolean } = {}): Promise<void> {
  const text = leadCardText(lead, options);

  if (telegram.enabled && telegram.leadsChatId) {
    await enqueue({
      dedupeKey: `lead:${lead.id}:card${options.repeat ? ':repeat' : ''}`,
      leadId: lead.id,
      payload: {
        kind: 'telegram',
        chatId: telegram.leadsChatId,
        text,
        buttons: leadCardButtons(lead.id),
      },
    });
  }

  // Fallback channel: always queued too, so a Telegram outage still notifies.
  if (email.enabled) {
    await enqueue({
      dedupeKey: `lead:${lead.id}:email${options.repeat ? ':repeat' : ''}`,
      leadId: lead.id,
      delaySeconds: 60,
      payload: { kind: 'email', subject: leadEmailSubject(lead), text: leadEmailText(lead) },
    });
  }

  if (leadWebhookUrl()) {
    await enqueue({
      dedupeKey: `lead:${lead.id}:webhook:created`,
      leadId: lead.id,
      payload: { kind: 'webhook', event: 'lead.created', data: { id: lead.id, status: lead.status } },
    });
  }
}

export async function enqueueWebhookEvent(event: string, dedupeKey: string, leadId: number, data: Record<string, unknown>) {
  if (!leadWebhookUrl()) return;
  await enqueue({ dedupeKey, leadId, payload: { kind: 'webhook', event, data } });
}

export type OutboxResult = { picked: number; sent: number; failed: number; deferred: number };

/** Delivers every job that is due. Called by cron and after each lead. */
export async function processOutbox(limit = 20): Promise<OutboxResult> {
  const db = await getDb();
  const now = new Date();

  const jobs = await db
    .select()
    .from(notificationJobs)
    .where(and(eq(notificationJobs.status, 'pending'), lte(notificationJobs.nextAttemptAt, now)))
    .orderBy(asc(notificationJobs.nextAttemptAt))
    .limit(limit);

  const result: OutboxResult = { picked: jobs.length, sent: 0, failed: 0, deferred: 0 };

  for (const job of jobs) {
    const payload = job.payload as unknown as NotificationPayload;
    try {
      if (payload.kind === 'telegram') await telegramNotifier.send(payload);
      else if (payload.kind === 'email') await emailNotifier.send(payload);
      else await webhookNotifier.send(payload);

      await db
        .update(notificationJobs)
        .set({ status: 'sent', sentAt: new Date(), attempts: job.attempts + 1, lastError: null })
        .where(eq(notificationJobs.id, job.id));
      result.sent += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const message = error instanceof Error ? error.message : String(error);
      const exhausted = attempts >= MAX_ATTEMPTS;
      const backoff = BACKOFF_SECONDS[Math.min(attempts, BACKOFF_SECONDS.length - 1)] ?? 21600;

      await db
        .update(notificationJobs)
        .set({
          attempts,
          lastError: message.slice(0, 500),
          status: exhausted ? 'failed' : 'pending',
          nextAttemptAt: new Date(Date.now() + backoff * 1000),
        })
        .where(eq(notificationJobs.id, job.id));

      if (exhausted) result.failed += 1;
      else result.deferred += 1;
    }
  }

  return result;
}

/** Jobs that exhausted their retries or are still queued — shown in the admin. */
export async function outboxHealth(): Promise<{ pending: number; failed: number }> {
  const db = await getDb();
  const rows = await db
    .select({ status: notificationJobs.status, count: sql<number>`count(*)::int` })
    .from(notificationJobs)
    .groupBy(notificationJobs.status);

  let pending = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.status === 'pending') pending = Number(row.count);
    if (row.status === 'failed') failed = Number(row.count);
  }
  return { pending, failed };
}

export async function listNotificationJobs(limit = 100) {
  const db = await getDb();
  return db.select().from(notificationJobs).orderBy(sql`${notificationJobs.id} desc`).limit(limit);
}

/** Re-queues a failed job after the operator fixed the cause (e.g. bot token). */
export async function retryJob(id: number): Promise<void> {
  const db = await getDb();
  await db
    .update(notificationJobs)
    .set({ status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null })
    .where(eq(notificationJobs.id, id));
}
