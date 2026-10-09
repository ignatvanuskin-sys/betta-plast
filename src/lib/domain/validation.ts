/**
 * Shared validation schemas. The same schema runs in the browser (instant
 * feedback) and on the server (the server never trusts the client).
 */
import { z } from 'zod';

import { normalizePhone } from './phone';
import { LOST_REASONS } from './statuses';

export const CONSENT_VERSION = '2026-10-01';

export const LEAD_KINDS = ['window', 'balcony', 'partition', 'repair', 'other'] as const;
export const FORM_KINDS = ['quick', 'calculator', 'measure', 'repair', 'b2b', 'callback'] as const;
export const SEGMENTS = ['b2c', 'b2b'] as const;
export const PREFERRED_CONTACT = ['call', 'whatsapp', 'any'] as const;

export const KIND_LABELS_RU: Record<(typeof LEAD_KINDS)[number], string> = {
  window: 'Окно',
  balcony: 'Балкон / лоджия',
  partition: 'Перегородка',
  repair: 'Ремонт / регулировка',
  other: 'Другое',
};

export const REPAIR_ISSUES = [
  'not_closing',
  'blowing',
  'condensation',
  'broken_handle',
  'balcony_door',
  'other',
] as const;

export const REPAIR_ISSUE_LABELS_RU: Record<(typeof REPAIR_ISSUES)[number], string> = {
  not_closing: 'Не закрывается',
  blowing: 'Дует из окна',
  condensation: '«Плачет» окно',
  broken_handle: 'Сломана ручка',
  balcony_door: 'Балконная дверь',
  other: 'Другое',
};

/** Districts of Karaganda used in the calculator (dictionary, admin-editable). */
export const KARAGANDA_DISTRICTS = [
  'Казыбек Би',
  'Октябрьский',
  'Михайловка',
  'Фёдоровка',
  'Сортировка',
  'Степной',
  'Новый город',
  'Пришахтинск',
  'Майкудук',
  'Юго-Восток',
  'Темиртау',
  'Другой',
] as const;

const phoneField = z
  .string()
  .trim()
  .min(1, 'Укажите телефон')
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Проверьте номер телефона' });
      return z.NEVER;
    }
    return normalized;
  });

const nameField = z
  .string()
  .trim()
  .min(2, 'Укажите имя')
  .max(120, 'Слишком длинное имя');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

export const leadSubmissionSchema = z.object({
  submissionId: z.string().trim().min(8).max(64),
  formKind: z.enum(FORM_KINDS),
  kind: z.enum(LEAD_KINDS),
  segment: z.enum(SEGMENTS).default('b2c'),

  name: nameField,
  phone: phoneField,
  email: z.string().trim().email('Проверьте email').optional().or(z.literal('')),

  organization: optionalText(200),
  district: optionalText(64),
  address: optionalText(300),
  comment: optionalText(2000),
  preferredContact: z.enum(PREFERRED_CONTACT).default('call'),
  preferredDates: optionalText(200),

  calcPayload: z.record(z.unknown()).optional(),

  /** Consent must be explicit — never pre-checked (§14). */
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Нужно согласие на обработку персональных данных' }),
  }),
  consentVersion: z.string().trim().max(16).default(CONSENT_VERSION),

  /** Honeypot: a hidden field that humans never fill in. */
  honeypot: z.string().max(0, 'Отклонено').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),

  /** Attribution, filled by the client from the current URL. */
  src: optionalText(64),
  utm: z.record(z.string().max(200)).optional(),
  referrer: optionalText(500),
  landingPath: optionalText(300),
  pagePath: optionalText(300),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  lang: z.enum(['ru', 'kk']).default('ru'),
  sessionId: optionalText(64),
});

export type LeadSubmissionInput = z.input<typeof leadSubmissionSchema>;
export type LeadSubmission = z.output<typeof leadSubmissionSchema>;

/** Flattens Zod issues into `{ field: message }` for form rendering. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export const statusUpdateSchema = z.object({
  status: z.string().trim().min(1),
  lostReason: z.enum(LOST_REASONS).optional(),
  note: optionalText(1000),
});

export const measureRequestSchema = z.object({
  leadId: z.coerce.number().int().positive(),
  startsAt: z.string().datetime({ offset: true }),
  address: optionalText(300),
  notes: optionalText(500),
});

export const adminNoteSchema = z.object({
  leadId: z.coerce.number().int().positive(),
  text: z.string().trim().min(1, 'Введите текст').max(2000),
});

export const MAX_LEAD_FILE_BYTES = 15 * 1024 * 1024; // 15 MB (§7.7)
export const MAX_LEAD_FILES = 3;

export const ALLOWED_LEAD_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'image/vnd.dwg',
  'application/acad',
  'application/dwg',
  'image/vnd.dxf',
  'application/octet-stream', // некоторые браузеры не отдают MIME для DWG
] as const;
