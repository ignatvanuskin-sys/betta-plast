/**
 * Lead status pipeline (§11).
 *
 * `new → taken → contacted → measure_booked → measured → quote_sent → won →
 *  in_production → installed → closed`, plus the side states `lost` and `spam`.
 */

export const LEAD_STATUSES = [
  'new',
  'taken',
  'contacted',
  'measure_booked',
  'measured',
  'quote_sent',
  'won',
  'in_production',
  'installed',
  'closed',
  'lost',
  'spam',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Statuses that mean "nobody has reacted yet" — used by the SLA escalation. */
export const OPEN_STATUSES: LeadStatus[] = ['new', 'taken', 'contacted', 'measure_booked', 'measured', 'quote_sent', 'won', 'in_production'];

export const CLOSED_STATUSES: LeadStatus[] = ['closed', 'lost', 'spam'];

export const STATUS_LABELS_RU: Record<LeadStatus, string> = {
  new: 'Новая',
  taken: 'Взял в работу',
  contacted: 'Связались',
  measure_booked: 'Замер назначен',
  measured: 'Замер выполнен',
  quote_sent: 'Расчёт отправлен',
  won: 'Договор',
  in_production: 'В производстве',
  installed: 'Смонтировано',
  closed: 'Закрыта',
  lost: 'Отказ',
  spam: 'Спам',
};

/**
 * Allowed transitions. `spam` and `lost` are reachable from anywhere (people
 * mistype, change their mind), while `closed` is a normal end state.
 */
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['taken', 'contacted', 'lost', 'spam'],
  taken: ['contacted', 'measure_booked', 'lost', 'spam'],
  contacted: ['measure_booked', 'quote_sent', 'lost', 'spam'],
  measure_booked: ['measured', 'contacted', 'lost', 'spam'],
  measured: ['quote_sent', 'lost', 'spam'],
  quote_sent: ['won', 'lost', 'in_production', 'spam'],
  won: ['in_production', 'lost', 'spam'],
  in_production: ['installed', 'lost', 'spam'],
  installed: ['closed', 'spam'],
  closed: ['installed'],
  lost: ['contacted', 'taken'],
  spam: ['new'],
};

export const LOST_REASONS = ['too_expensive', 'chose_competitor', 'no_answer', 'changed_mind', 'out_of_area', 'other'] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABELS_RU: Record<LostReason, string> = {
  too_expensive: 'Дорого',
  chose_competitor: 'Выбрал другую компанию',
  no_answer: 'Не отвечает',
  changed_mind: 'Передумал',
  out_of_area: 'Вне зоны выезда',
  other: 'Другое',
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return false;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function allowedTransitions(from: LeadStatus): LeadStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** `lost` requires a reason — enforced by the domain layer, not only the UI. */
export function requiresLostReason(to: LeadStatus): boolean {
  return to === 'lost';
}

export function isOpenStatus(status: LeadStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
