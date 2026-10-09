/**
 * Message templates (Приложение C). Kept in one place so that Telegram cards,
 * the fallback email and the WhatsApp drafts always stay consistent.
 */
import { contacts, site } from '../config';
import { describeCalc } from '../domain/catalog';
import { formatPhone } from '../domain/phone';
import { SOURCE_LABELS_RU, type LeadSource } from '../domain/sources';
import { STATUS_LABELS_RU, type LeadStatus } from '../domain/statuses';
import { formatDateTimeRu } from '../domain/time';
import { KIND_LABELS_RU, type LeadSubmission } from '../domain/validation';
import type { Lead } from '../db/schema';
import type { TelegramButton } from './types';

export const CALLBACK = {
  taken: (id: number) => `l:t:${id}`,
  call: (id: number) => `l:c:${id}`,
  whatsapp: (id: number) => `l:w:${id}`,
  measure: (id: number) => `l:m:${id}`,
  status: (id: number) => `l:s:${id}`,
  spam: (id: number) => `l:x:${id}`,
} as const;

/** Compact one-line tag showing what kind of lead it is. */
function kindLabel(kind: string): string {
  if (kind === 'window') return 'окно';
  if (kind === 'balcony') return 'балкон';
  if (kind === 'partition') return 'перегородка';
  if (kind === 'repair') return 'ремонт';
  return 'заявка';
}

export function leadTags(lead: Pick<Lead, 'segment' | 'kind' | 'priority' | 'formKind'>): string {
  const tags: string[] = [];
  if (lead.segment === 'b2b') tags.push('🏢 B2B');
  if (lead.kind === 'repair' || lead.formKind === 'repair') tags.push('🛠 ремонт');
  if (lead.priority === 'urgent' || lead.priority === 'high') tags.push('⚡ срочно');
  if (lead.formKind === 'measure') tags.push('📅 замер');
  return tags.length > 0 ? `  ${tags.join(' | ')}` : '';
}

export function sourceLabel(source: string): string {
  return SOURCE_LABELS_RU[source as LeadSource] ?? 'Другое';
}

export function leadCardText(lead: Lead, options: { repeat?: boolean } = {}): string {
  const lines: string[] = [];
  lines.push(`🆕 Заявка #${lead.id} · ${kindLabel(lead.kind)}${leadTags(lead)}${options.repeat ? '  🔁 повторно' : ''}`);
  lines.push('');
  lines.push(`👤 ${lead.name}`);
  lines.push(`📞 ${formatPhone(lead.phoneNormalized)}`);
  if (lead.organization) lines.push(`🏢 ${lead.organization}`);
  if (lead.productType) lines.push(`🧱 ${lead.productType}`);
  const calc = describeCalc(lead.kind as never, lead.calcPayload ?? undefined);
  if (calc) lines.push(`📐 ${calc}`);
  if (lead.district || lead.address) {
    lines.push(`📍 ${[lead.district, lead.address].filter(Boolean).join(' · ')}${lead.calcPayload?.floor ? ` · этаж ${lead.calcPayload.floor}` : ''}`);
  }
  if (lead.preferredDates) lines.push(`🕒 Хочет: ${lead.preferredDates}`);
  if (lead.comment) lines.push(`💬 ${lead.comment}`);
  lines.push(`🔗 Источник: ${sourceLabel(lead.source)}${lead.pagePath ? ` · ${lead.pagePath}` : ''}`);
  lines.push(`⏱ Получена: ${formatDateTimeRu(lead.createdAt)} (${site.timezone})`);
  lines.push('');
  lines.push(`Статус: ${STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status}`);
  return lines.join('\n');
}

export function leadCardButtons(leadId: number): TelegramButton[][] {
  return [
    [
      { text: '✅ Взял в работу', callbackData: CALLBACK.taken(leadId) },
      { text: '📞 Позвонить', callbackData: CALLBACK.call(leadId) },
      { text: '💬 WhatsApp', callbackData: CALLBACK.whatsapp(leadId) },
    ],
    [
      { text: '📅 Назначить замер', callbackData: CALLBACK.measure(leadId) },
      { text: '🔄 Статус', callbackData: CALLBACK.status(leadId) },
      { text: '🗑 Спам', callbackData: CALLBACK.spam(leadId) },
    ],
  ];
}

export function leadEmailSubject(lead: Lead): string {
  return `Новая заявка #${lead.id} — ${kindLabel(lead.kind)}${lead.segment === 'b2b' ? ' (B2B)' : ''}`;
}

export function leadEmailText(lead: Lead): string {
  return [
    leadCardText(lead),
    '',
    'Открыть в админке: ' + `${site.url}/admin/leads/${lead.id}`,
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* WhatsApp drafts — always opened by a human, never auto-sent (§8.5)          */
/* -------------------------------------------------------------------------- */

export function waLink(text: string, phone?: string): string {
  const number = (phone ?? contacts.whatsapp).replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const waTemplates = {
  site: (input: { kind: string; district?: string }) =>
    `Здравствуйте! Пишу с сайта. Интересует: ${KIND_LABELS_RU[input.kind as never] ?? input.kind}.${input.district ? ` Район: ${input.district}.` : ''}`,

  balcony: (input: { objectType?: string; size?: string; leadId?: number }) =>
    `Здравствуйте! Хочу рассчитать остекление ${input.objectType === 'loggia' ? 'лоджии' : 'балкона'}: ${input.size ?? 'размеры уточню'}.${input.leadId ? ` Заявка с сайта №${input.leadId}.` : ''}`,

  measure: (input: { date: string; time: string; leadId?: number }) =>
    `Здравствуйте! Хочу записаться на замер на ${input.date} в ${input.time}.${input.leadId ? ` Заявка №${input.leadId}.` : ''}`,

  repair: (input: { issue: string; district?: string; leadId?: number }) =>
    `Здравствуйте! Нужен мастер: ${input.issue}.${input.district ? ` Район: ${input.district}.` : ''}${input.leadId ? ` Заявка №${input.leadId}.` : ''}`,

  /** Sent by the manager (opens in WhatsApp, the human presses send). */
  measureConfirm: (input: { name: string; date: string; time: string; address: string }) =>
    `Здравствуйте, ${input.name}! Подтверждаем замер ${input.date} в ${input.time}, адрес: ${input.address}. Если планы изменятся — напишите нам. Бетта Пласт, ${contacts.phonePrimary}.`,

  reviewRequest: (input: { name: string }) =>
    `Здравствуйте, ${input.name}! Спасибо, что выбрали Бетта Пласт. Если у вас есть минутка, поделитесь, пожалуйста, впечатлением о работе: ${contacts.gisReviewsUrl}. Нам важно ваше мнение.`,
};

/** Text prefilled when a visitor clicks "Написать в WhatsApp" on the site. */
export function waDefaultText(input: { kind?: string; district?: string; leadId?: number; page?: string } = {}): string {
  const parts = ['Здравствуйте! Пишу с сайта.'];
  if (input.kind) parts.push(`Интересует: ${KIND_LABELS_RU[input.kind as never] ?? input.kind}.`);
  if (input.district) parts.push(`Район: ${input.district}.`);
  if (input.page) parts.push(`Страница: ${input.page}.`);
  if (input.leadId) parts.push(`Заявка №${input.leadId}.`);
  return parts.join(' ');
}

export function submissionToCalcPayload(submission: LeadSubmission): Record<string, unknown> {
  return (submission.calcPayload ?? {}) as Record<string, unknown>;
}
