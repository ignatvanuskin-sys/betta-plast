/**
 * Database schema (§11 мастер-промпта).
 *
 * PostgreSQL dialect. The same migrations are applied to a real Postgres
 * (production) and to the embedded PGlite database (local/demo).
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/* Admin users and staff                                                       */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: text('name').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    /** owner | manager | viewer */
    role: varchar('role', { length: 16 }).notNull().default('manager'),
    totpSecret: text('totp_secret'),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    active: boolean('active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_uq').on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/** Telegram staff whitelist. */
export const staff = pgTable(
  'staff',
  {
    id: serial('id').primaryKey(),
    telegramId: varchar('telegram_id', { length: 32 }).notNull(),
    name: text('name').notNull(),
    /** owner | manager | measurer */
    role: varchar('role', { length: 16 }).notNull().default('manager'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('staff_telegram_uq').on(t.telegramId)],
);

/** One-time registration codes issued from the admin panel. */
export const staffInvites = pgTable('staff_invites', {
  code: varchar('code', { length: 32 }).primaryKey(),
  name: text('name').notNull().default(''),
  role: varchar('role', { length: 16 }).notNull().default('manager'),
  usedByTelegramId: varchar('used_by_telegram_id', { length: 32 }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Leads                                                                       */
/* -------------------------------------------------------------------------- */

export const leads = pgTable(
  'leads',
  {
    id: serial('id').primaryKey(),
    /** Idempotency key produced by the client form. */
    submissionId: varchar('submission_id', { length: 64 }).notNull(),

    /** b2c | b2b */
    segment: varchar('segment', { length: 8 }).notNull().default('b2c'),
    /** window | balcony | partition | repair | other */
    kind: varchar('kind', { length: 16 }).notNull().default('other'),
    /** Form of origin: quick | calculator | measure | repair | b2b | callback */
    formKind: varchar('form_kind', { length: 16 }).notNull().default('quick'),

    name: text('name').notNull(),
    phone: text('phone').notNull(),
    phoneNormalized: varchar('phone_normalized', { length: 16 }).notNull(),
    email: text('email'),
    organization: text('organization'),

    productType: text('product_type'),
    calcPayload: jsonb('calc_payload').$type<Record<string, unknown>>(),
    district: text('district'),
    address: text('address'),
    comment: text('comment'),
    preferredContact: varchar('preferred_contact', { length: 16 }).notNull().default('call'),
    preferredDates: text('preferred_dates'),

    status: varchar('status', { length: 24 }).notNull().default('new'),
    assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    /** normal | high | urgent */
    priority: varchar('priority', { length: 8 }).notNull().default('normal'),

    source: varchar('source', { length: 32 }).notNull().default('direct'),
    utm: jsonb('utm').$type<Record<string, string>>(),
    referrer: text('referrer'),
    landingPath: text('landing_path'),
    pagePath: text('page_path'),
    device: varchar('device', { length: 16 }),
    lang: varchar('lang', { length: 8 }).notNull().default('ru'),

    consentAt: timestamp('consent_at', { withTimezone: true }),
    consentVersion: varchar('consent_version', { length: 16 }),

    lostReason: varchar('lost_reason', { length: 32 }),
    lostComment: text('lost_comment'),
    reviewRequestedAt: timestamp('review_requested_at', { withTimezone: true }),
    firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
    /** Public token for the phase-3 order status page. */
    statusToken: varchar('status_token', { length: 40 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('leads_submission_uq').on(t.submissionId),
    uniqueIndex('leads_status_token_uq').on(t.statusToken),
    index('leads_phone_idx').on(t.phoneNormalized),
    index('leads_status_idx').on(t.status),
    index('leads_created_idx').on(t.createdAt),
    index('leads_assignee_idx').on(t.assigneeId),
  ],
);

export const leadEvents = pgTable(
  'lead_events',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    /** created | status_changed | assigned | note | file | notify | repeat_contact | review_requested | deleted */
    type: varchar('type', { length: 32 }).notNull(),
    fromStatus: varchar('from_status', { length: 24 }),
    toStatus: varchar('to_status', { length: 24 }),
    /** system | user | staff | client */
    actorType: varchar('actor_type', { length: 16 }).notNull().default('system'),
    actorId: text('actor_id'),
    actorName: text('actor_name'),
    /** Where the change came from: form | admin | telegram | webhook | cron */
    channel: varchar('channel', { length: 16 }),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('lead_events_lead_idx').on(t.leadId, t.createdAt)],
);

export const leadFiles = pgTable(
  'lead_files',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    mime: varchar('mime', { length: 128 }).notNull(),
    size: integer('size').notNull(),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('lead_files_lead_idx').on(t.leadId)],
);

/* -------------------------------------------------------------------------- */
/* Measurements (замеры)                                                       */
/* -------------------------------------------------------------------------- */

export const measurements = pgTable(
  'measurements',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    address: text('address').notNull().default(''),
    district: text('district'),
    /** pending | confirmed | done | cancelled */
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('measurements_starts_idx').on(t.startsAt), index('measurements_lead_idx').on(t.leadId)],
);

/** Weekly slot rules; slot length and capacity are admin-configurable. */
export const measurementRules = pgTable(
  'measurement_rules',
  {
    weekday: smallint('weekday').notNull(),
    /** Minutes from midnight, local time (Asia/Almaty). */
    startMinute: integer('start_minute').notNull(),
    endMinute: integer('end_minute').notNull(),
    slotMinutes: integer('slot_minutes').notNull().default(60),
    capacity: integer('capacity').notNull().default(1),
    enabled: boolean('enabled').notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.weekday] })],
);

export const blackoutDates = pgTable('blackout_dates', {
  day: date('day').primaryKey(),
  reason: text('reason').notNull().default(''),
});

/* -------------------------------------------------------------------------- */
/* Catalog / calculator                                                        */
/* -------------------------------------------------------------------------- */

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 32 }).notNull(),
    titleRu: text('title_ru').notNull(),
    /** window | balcony | partition | repair | other */
    kind: varchar('kind', { length: 16 }).notNull(),
    active: boolean('active').notNull().default(true),
    sort: integer('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('products_code_uq').on(t.code)],
);

export const productOptions = pgTable(
  'product_options',
  {
    id: serial('id').primaryKey(),
    productCode: varchar('product_code', { length: 32 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    titleRu: text('title_ru').notNull(),
    /** number | select | multiselect | boolean */
    type: varchar('type', { length: 16 }).notNull(),
    /** select/multiselect choices */
    choices: jsonb('choices').$type<Array<{ value: string; label: string }>>(),
    unit: varchar('unit', { length: 16 }),
    required: boolean('required').notNull().default(false),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [uniqueIndex('product_options_uq').on(t.productCode, t.code)],
);

/** Price formula. Only consulted when PRICE_DISPLAY=range. */
export const priceRules = pgTable(
  'price_rules',
  {
    id: serial('id').primaryKey(),
    basePricePerM2: integer('base_price_per_m2').notNull().default(0),
    /** e.g. { balcony: 1.15, window: 1, partition: 0.9 } */
    kindCoef: jsonb('kind_coef').$type<Record<string, number>>(),
    /** e.g. { warm_glazing: 1.25, insulation: 1.1 } */
    optionCoef: jsonb('option_coef').$type<Record<string, number>>(),
    installPrice: integer('install_price').notNull().default(0),
    deliveryPrice: integer('delivery_price').notNull().default(0),
    active: boolean('active').notNull().default(true),
    note: text('note'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('price_rules_active_idx').on(t.active, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Gallery, curated reviews, claims                                            */
/* -------------------------------------------------------------------------- */

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: serial('id').primaryKey(),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    beforeUrl: text('before_url'),
    /** windows | balconies | partitions | repair */
    category: varchar('category', { length: 16 }).notNull().default('windows'),
    caption: text('caption').notNull().default(''),
    sort: integer('sort').notNull().default(0),
    showOnHome: boolean('show_on_home').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('gallery_category_idx').on(t.category, t.sort)],
);

export const reviewsCurated = pgTable('reviews_curated', {
  id: serial('id').primaryKey(),
  author: text('author').notNull(),
  text: text('text').notNull(),
  sourceUrl: text('source_url'),
  /** Consent of the review author is required before publishing (§7.6). */
  consent: boolean('consent').notNull().default(false),
  approved: boolean('approved').notNull().default(false),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Claims registry (§5). Public pages render only rows with status = confirmed.
 */
export const claims = pgTable(
  'claims',
  {
    key: varchar('key', { length: 48 }).primaryKey(),
    textRu: text('text_ru').notNull().default(''),
    textKk: text('text_kk').notNull().default(''),
    /** confirmed | unconfirmed */
    status: varchar('status', { length: 16 }).notNull().default('unconfirmed'),
    /** 2gis | owner | reviews | none */
    source: varchar('source', { length: 16 }).notNull().default('none'),
    questionRu: text('question_ru').notNull().default(''),
    note: text('note').notNull().default(''),
    confirmedBy: text('confirmed_by'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('claims_status_idx').on(t.status)],
);

/* -------------------------------------------------------------------------- */
/* Infrastructure: outbox, settings, analytics events, rate limits             */
/* -------------------------------------------------------------------------- */

export const notificationJobs = pgTable(
  'notification_jobs',
  {
    id: serial('id').primaryKey(),
    /** telegram | email | webhook */
    channel: varchar('channel', { length: 16 }).notNull(),
    /** Stable key so the same notification is never queued twice. */
    dedupeKey: varchar('dedupe_key', { length: 128 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    /** pending | sent | failed */
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    /** Set when the payload is resolved but delivery failed; admin shows a red flag. */
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    leadId: integer('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('notification_jobs_dedupe_uq').on(t.dedupeKey),
    index('notification_jobs_status_idx').on(t.status, t.nextAttemptAt),
  ],
);

export const settings = pgTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 48 }).notNull(),
    leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 64 }),
    path: text('path'),
    props: jsonb('props').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_name_idx').on(t.name, t.createdAt)],
);

/** Simple fixed-window rate limiter backed by the database. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    bucket: varchar('bucket', { length: 128 }).primaryKey(),
    count: integer('count').notNull().default(0),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rate_limits_window_idx').on(t.windowStart)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                   */
/* -------------------------------------------------------------------------- */

export const leadsRelations = relations(leads, ({ many, one }) => ({
  events: many(leadEvents),
  files: many(leadFiles),
  measurements: many(measurements),
  assignee: one(users, { fields: [leads.assigneeId], references: [users.id] }),
}));

export const leadEventsRelations = relations(leadEvents, ({ one }) => ({
  lead: one(leads, { fields: [leadEvents.leadId], references: [leads.id] }),
}));

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadEvent = typeof leadEvents.$inferSelect;
export type Measurement = typeof measurements.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type NotificationJob = typeof notificationJobs.$inferSelect;
export type User = typeof users.$inferSelect;
export type StaffMember = typeof staff.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
