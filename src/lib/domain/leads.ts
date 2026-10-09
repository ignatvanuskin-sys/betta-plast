/**
 * Lead pipeline (§8.1). Transport-agnostic: the same functions serve the
 * website forms, the Telegram bot, the admin panel and any future channel.
 *
 * Guarantees:
 *  - a lead is written to the database before any notification is queued;
 *  - `submission_id` makes submission idempotent (double-click safe);
 *  - the same phone within 24 h produces an event on the existing lead;
 *  - every status change is written to `lead_events` with actor and channel.
 */
import { and, desc, eq, gte, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { antiSpam } from '../config';
import { getDb } from '../db/client';
import { leadEvents, leadFiles, leads, notificationJobs, type Lead } from '../db/schema';
import { enqueueNewLead, enqueueWebhookEvent } from '../notify/outbox';
import { leadCardButtons, leadCardText } from '../notify/messages';
import { enqueue } from '../notify/outbox';
import { consumeRateLimit } from './ratelimit';
import { resolveSource } from './sources';
import {
  canTransition,
  isLeadStatus,
  requiresLostReason,
  type LeadStatus,
  type LostReason,
} from './statuses';
import type { LeadSubmission } from './validation';
import { telegram } from '../config';
import { KIND_LABELS_RU } from './validation';

const REPEAT_WINDOW_HOURS = 24;

export class LeadError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'validation'
      | 'rate_limited'
      | 'forbidden_transition'
      | 'lost_reason_required'
      | 'not_found'
      | 'duplicate',
  ) {
    super(message);
    this.name = 'LeadError';
  }
}

export type CreateLeadContext = {
  ip: string;
  userAgent?: string;
  /** `form` for the website, `telegram` for operator-created leads. */
  channel?: string;
};

export type CreateLeadResult = {
  lead: Lead;
  /** True when the request was merged into an existing lead as a repeat contact. */
  repeated: boolean;
  created: boolean;
};

function detectDevice(userAgent: string | undefined): 'mobile' | 'tablet' | 'desktop' {
  const ua = (userAgent ?? '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Creates a lead from a validated submission.
 * Order matters: validate → rate-limit → persist → queue notifications.
 */
export async function createLead(
  submission: LeadSubmission,
  context: CreateLeadContext,
): Promise<CreateLeadResult> {
  const db = await getDb();

  // --- anti-spam -----------------------------------------------------------
  const ipLimit = await consumeRateLimit(
    `lead:ip:${context.ip}`,
    antiSpam.rateLimitPerHourPerIp,
    3600,
  );
  if (!ipLimit.allowed) {
    throw new LeadError('Слишком много заявок с этого адреса. Попробуйте позже или позвоните нам.', 'rate_limited');
  }
  const phoneLimit = await consumeRateLimit(
    `lead:phone:${submission.phone}`,
    antiSpam.rateLimitPerHourPerPhone,
    3600,
  );
  if (!phoneLimit.allowed) {
    throw new LeadError('Заявка с этого номера уже отправлена. Мы свяжемся с вами.', 'rate_limited');
  }

  // --- idempotency by submission id ---------------------------------------
  const existingSubmission = await db
    .select()
    .from(leads)
    .where(eq(leads.submissionId, submission.submissionId))
    .limit(1);
  if (existingSubmission[0]) {
    return { lead: existingSubmission[0], repeated: false, created: false };
  }

  // --- repeat contact within 24 h -----------------------------------------
  const since = new Date(Date.now() - REPEAT_WINDOW_HOURS * 3600 * 1000);
  const recent = await db
    .select()
    .from(leads)
    .where(and(eq(leads.phoneNormalized, submission.phone), gte(leads.createdAt, since)))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  const previous = recent[0];

  if (previous && !['closed', 'lost', 'spam'].includes(previous.status)) {
    await db.insert(leadEvents).values({
      leadId: previous.id,
      type: 'repeat_contact',
      actorType: 'client',
      channel: context.channel ?? 'form',
      meta: {
        kind: submission.kind,
        formKind: submission.formKind,
        comment: submission.comment ?? null,
        calcPayload: submission.calcPayload ?? null,
        pagePath: submission.pagePath ?? null,
      },
    });
    await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, previous.id));

    const updated = { ...previous };
    await notifyRepeatContact(updated);
    return { lead: updated, repeated: true, created: false };
  }

  // --- persist first -------------------------------------------------------
  const source = resolveSource({ src: submission.src, utm: submission.utm, referrer: submission.referrer });
  const statusToken = randomBytes(16).toString('hex');

  const inserted = await db
    .insert(leads)
    .values({
      submissionId: submission.submissionId,
      segment: submission.segment ?? (submission.formKind === 'b2b' ? 'b2b' : 'b2c'),
      kind: submission.kind,
      formKind: submission.formKind,
      name: submission.name,
      phone: submission.phone,
      phoneNormalized: submission.phone,
      email: submission.email || null,
      organization: submission.organization ?? null,
      productType: KIND_LABELS_RU[submission.kind] ?? null,
      calcPayload: (submission.calcPayload ?? null) as Record<string, unknown> | null,
      district: submission.district ?? null,
      address: submission.address ?? null,
      comment: submission.comment ?? null,
      preferredContact: submission.preferredContact,
      preferredDates: submission.preferredDates ?? null,
      status: 'new',
      priority: submission.kind === 'repair' || submission.formKind === 'repair' ? 'high' : 'normal',
      source,
      utm: submission.utm ?? null,
      referrer: submission.referrer ?? null,
      landingPath: submission.landingPath ?? null,
      pagePath: submission.pagePath ?? null,
      device: submission.device ?? detectDevice(context.userAgent),
      lang: submission.lang,
      consentAt: new Date(),
      consentVersion: submission.consentVersion,
      statusToken,
    })
    .returning();

  const lead = inserted[0];
  if (!lead) throw new LeadError('Не удалось создать заявку', 'validation');

  await db.insert(leadEvents).values({
    leadId: lead.id,
    type: 'created',
    toStatus: 'new',
    actorType: 'client',
    channel: context.channel ?? 'form',
    meta: { source, ip: context.ip },
  });

  await enqueueNewLead(lead);
  return { lead, repeated: false, created: true };
}

async function notifyRepeatContact(lead: Lead): Promise<void> {
  if (!telegram.enabled || !telegram.leadsChatId) return;
  await enqueue({
    dedupeKey: `lead:${lead.id}:card:repeat:${Date.now()}`,
    leadId: lead.id,
    payload: {
      kind: 'telegram',
      chatId: telegram.leadsChatId,
      text: `🔁 Повторное обращение по заявке #${lead.id}\n\n${leadCardText(lead)}`,
      buttons: leadCardButtons(lead.id),
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Status changes                                                             */
/* -------------------------------------------------------------------------- */

export type StatusChangeInput = {
  leadId: number;
  to: LeadStatus;
  actorType?: 'user' | 'staff' | 'system';
  actorId?: string | number | null;
  actorName?: string | null;
  channel?: string;
  lostReason?: LostReason;
  note?: string;
  /** For «Взял в работу» — the admin user that becomes the assignee. */
  assigneeId?: number | null;
};

export async function changeLeadStatus(input: StatusChangeInput): Promise<Lead> {
  const db = await getDb();
  const rows = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
  const lead = rows[0];
  if (!lead) throw new LeadError('Заявка не найдена', 'not_found');

  const from = lead.status;
  if (!isLeadStatus(from) || !isLeadStatus(input.to)) {
    throw new LeadError('Неизвестный статус', 'validation');
  }
  if (!canTransition(from, input.to)) {
    throw new LeadError(`Нельзя перейти из «${from}» в «${input.to}»`, 'forbidden_transition');
  }
  if (requiresLostReason(input.to) && !input.lostReason) {
    throw new LeadError('Укажите причину отказа', 'lost_reason_required');
  }

  const patch: Partial<Lead> = { status: input.to, updatedAt: new Date() };
  if (input.to === 'lost') {
    patch.lostReason = input.lostReason ?? null;
    if (input.note) patch.lostComment = input.note;
  }
  // First human reaction is what the SLA measures.
  if (!lead.firstResponseAt && ['taken', 'contacted', 'measure_booked'].includes(input.to)) {
    patch.firstResponseAt = new Date();
  }
  if (input.to === 'taken' && input.assigneeId) {
    patch.assigneeId = input.assigneeId;
  }

  const updated = await db.update(leads).set(patch).where(eq(leads.id, lead.id)).returning();
  const next = updated[0] ?? lead;

  await db.insert(leadEvents).values({
    leadId: lead.id,
    type: 'status_changed',
    fromStatus: from,
    toStatus: input.to,
    actorType: input.actorType ?? 'system',
    actorId: input.actorId != null ? String(input.actorId) : null,
    actorName: input.actorName ?? null,
    channel: input.channel ?? null,
    meta: input.note ? { note: input.note } : null,
  });

  await enqueueWebhookEvent('lead.status_changed', `lead:${lead.id}:status:${input.to}:${Date.now()}`, lead.id, {
    id: lead.id,
    from,
    to: input.to,
    lostReason: input.lostReason ?? null,
  });

  return next;
}

export async function assignLead(leadId: number, assigneeId: number | null, actor: string): Promise<void> {
  const db = await getDb();
  await db.update(leads).set({ assigneeId, updatedAt: new Date() }).where(eq(leads.id, leadId));
  await db.insert(leadEvents).values({
    leadId,
    type: 'assigned',
    actorType: 'user',
    actorName: actor,
    channel: 'admin',
    meta: { assigneeId },
  });
}

export async function addNote(leadId: number, text: string, actor: string, actorId?: number): Promise<void> {
  const db = await getDb();
  await db.insert(leadEvents).values({
    leadId,
    type: 'note',
    actorType: 'user',
    actorId: actorId != null ? String(actorId) : null,
    actorName: actor,
    channel: 'admin',
    meta: { text },
  });
}

export async function markReviewRequested(leadId: number, actor: string): Promise<void> {
  const db = await getDb();
  await db.update(leads).set({ reviewRequestedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, leadId));
  await db.insert(leadEvents).values({
    leadId,
    type: 'review_requested',
    actorType: 'user',
    actorName: actor,
    channel: 'admin',
  });
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

export type NewLeadFile = {
  fileName: string;
  mime: string;
  size: number;
  storageKey: string;
  url: string;
};

export async function attachFiles(leadId: number, files: NewLeadFile[]): Promise<void> {
  if (files.length === 0) return;
  const db = await getDb();
  await db.insert(leadFiles).values(files.map((file) => ({ ...file, leadId })));
  await db.insert(leadEvents).values({
    leadId,
    type: 'file',
    actorType: 'client',
    channel: 'form',
    meta: { count: files.length, names: files.map((f) => f.fileName) },
  });
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

export type LeadListFilters = {
  status?: LeadStatus[];
  source?: string;
  kind?: string;
  segment?: string;
  assigneeId?: number;
  search?: string;
  onlyUnanswered?: boolean;
  limit?: number;
  offset?: number;
};

export async function listLeads(filters: LeadListFilters = {}): Promise<{ rows: Lead[]; total: number }> {
  const db = await getDb();
  const conditions = [];

  if (filters.status?.length) conditions.push(inArray(leads.status, filters.status));
  if (filters.source) conditions.push(eq(leads.source, filters.source));
  if (filters.kind) conditions.push(eq(leads.kind, filters.kind));
  if (filters.segment) conditions.push(eq(leads.segment, filters.segment));
  if (filters.assigneeId) conditions.push(eq(leads.assigneeId, filters.assigneeId));
  if (filters.onlyUnanswered) conditions.push(isNull(leads.firstResponseAt));
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(or(like(leads.name, term), like(leads.phoneNormalized, term), like(leads.phone, term)));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;

  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRows = await db.select({ count: sql<number>`count(*)::int` }).from(leads).where(where);

  return { rows, total: Number(totalRows[0]?.count ?? 0) };
}

export async function getLead(id: number): Promise<Lead | null> {
  const db = await getDb();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLeadByToken(token: string): Promise<Lead | null> {
  const db = await getDb();
  const rows = await db.select().from(leads).where(eq(leads.statusToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function getLeadTimeline(leadId: number) {
  const db = await getDb();
  return db.select().from(leadEvents).where(eq(leadEvents.leadId, leadId)).orderBy(leadEvents.createdAt);
}

export async function getLeadFiles(leadId: number) {
  const db = await getDb();
  return db.select().from(leadFiles).where(eq(leadFiles.leadId, leadId));
}

/** Leads that got no human reaction within the SLA window (§16.7). */
export async function findUnansweredLeads(olderThanMinutes: number): Promise<Lead[]> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  return db
    .select()
    .from(leads)
    .where(and(isNull(leads.firstResponseAt), eq(leads.status, 'new'), sql`${leads.createdAt} <= ${cutoff}`))
    .orderBy(leads.createdAt);
}

/**
 * Deletes a client's data on request (§11/§14): files and events cascade from
 * the lead row; queued notifications are removed explicitly.
 */
export async function deleteLeadData(leadId: number, actor: string): Promise<void> {
  const db = await getDb();
  await db.delete(notificationJobs).where(eq(notificationJobs.leadId, leadId));
  await db.delete(leads).where(eq(leads.id, leadId));
  void actor;
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export type LeadStats = {
  today: number;
  week: number;
  month: number;
  unanswered: number;
  bySource: Array<{ source: string; count: number }>;
  byKind: Array<{ kind: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  avgFirstResponseMinutes: number | null;
  conversion: number | null;
};

export async function leadStats(): Promise<LeadStats> {
  const db = await getDb();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

  const countSince = async (since: Date) => {
    const rows = await db.select({ count: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, since));
    return Number(rows[0]?.count ?? 0);
  };

  const group = async (column: typeof leads.source | typeof leads.kind | typeof leads.status) => {
    const rows = await db
      .select({ value: column, count: sql<number>`count(*)::int` })
      .from(leads)
      .groupBy(column);
    return rows.map((row) => ({ key: String(row.value ?? '—'), count: Number(row.count) }));
  };

  const bySource = await group(leads.source);
  const byKind = await group(leads.kind);
  const byStatus = await group(leads.status);

  const unansweredRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(isNull(leads.firstResponseAt), inArray(leads.status, ['new'])));

  const responseRows = await db
    .select({
      avg: sql<number | null>`avg(extract(epoch from (${leads.firstResponseAt} - ${leads.createdAt})) / 60)`,
    })
    .from(leads)
    .where(sql`${leads.firstResponseAt} is not null`);

  const wonRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(inArray(leads.status, ['won', 'in_production', 'installed', 'closed']));
  const totalRows = await db.select({ count: sql<number>`count(*)::int` }).from(leads);

  const avg = responseRows[0]?.avg;
  const total = Number(totalRows[0]?.count ?? 0);
  const won = Number(wonRows[0]?.count ?? 0);

  return {
    today: await countSince(dayAgo),
    week: await countSince(weekAgo),
    month: await countSince(monthAgo),
    unanswered: Number(unansweredRows[0]?.count ?? 0),
    bySource: bySource.map((row) => ({ source: row.key, count: row.count })),
    byKind: byKind.map((row) => ({ kind: row.key, count: row.count })),
    byStatus: byStatus.map((row) => ({ status: row.key, count: row.count })),
    avgFirstResponseMinutes: avg != null ? Math.round(Number(avg)) : null,
    conversion: total > 0 ? Math.round((won / total) * 100) : null,
  };
}

/** Reports requests to the site's event log (§8.6). */
export async function trackEvent(input: {
  name: string;
  leadId?: number | null;
  sessionId?: string | null;
  path?: string | null;
  props?: Record<string, unknown> | null;
}): Promise<void> {
  const db = await getDb();
  const { events } = await import('../db/schema');
  await db.insert(events).values({
    name: input.name.slice(0, 48),
    leadId: input.leadId ?? null,
    sessionId: input.sessionId ?? null,
    path: input.path ?? null,
    props: input.props ?? null,
  });
}
