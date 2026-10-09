/**
 * Telegram bot logic (§8.4). Kept out of the route handler so the same actions
 * can be reused by the admin panel and by tests.
 *
 * Every callback is idempotent: pressing "Взял в работу" twice by two managers
 * produces one state, and the card is edited rather than reposted.
 */
import { and, desc, eq, gte, like, or } from 'drizzle-orm';

import { getDb } from '../db/client';
import { leads, staff, staffInvites, users } from '../db/schema';
import { changeLeadStatus, findUnansweredLeads, leadStats, listLeads, LeadError } from '../domain/leads';
import { formatPhone, normalizePhone } from '../domain/phone';
import { STATUS_LABELS_RU, isLeadStatus, type LeadStatus } from '../domain/statuses';
import { formatDateTimeRu, localDayKey } from '../domain/time';
import { getAvailableSlots, requestMeasurement, SlotError } from '../domain/slots';
import { leadCardButtons, leadCardText, waTemplates } from '../notify/messages';
import { answerCallbackQuery, telegramNotifier, type TelegramUpdate } from '../notify/telegram';
import { contacts } from '../config';

export type StaffRecord = { id: number; telegramId: string; name: string; role: string };

async function findStaff(telegramId: number | string): Promise<StaffRecord | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.telegramId, String(telegramId)), eq(staff.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** Registers a staff member using a one-time code issued in the admin panel. */
async function registerWithCode(telegramId: number, code: string, fallbackName: string): Promise<StaffRecord | null> {
  const db = await getDb();
  const rows = await db.select().from(staffInvites).where(eq(staffInvites.code, code.toUpperCase())).limit(1);
  const invite = rows[0];
  if (!invite || invite.usedAt) return null;

  const inserted = await db
    .insert(staff)
    .values({ telegramId: String(telegramId), name: invite.name || fallbackName, role: invite.role })
    .onConflictDoUpdate({
      target: staff.telegramId,
      set: { active: true, name: invite.name || fallbackName, role: invite.role },
    })
    .returning();

  await db
    .update(staffInvites)
    .set({ usedAt: new Date(), usedByTelegramId: String(telegramId) })
    .where(eq(staffInvites.code, invite.code));

  return inserted[0] ?? null;
}

async function reply(chatId: string | number, text: string, buttons?: ReturnType<typeof leadCardButtons>) {
  await telegramNotifier.send({ kind: 'telegram', chatId: String(chatId), text, buttons });
}

/* -------------------------------------------------------------------------- */
/* Card actions                                                               */
/* -------------------------------------------------------------------------- */

export type CardActionResult = { ok: boolean; toast?: string; updateCard?: boolean };

async function takeLead(leadId: number, actor: StaffRecord | null): Promise<CardActionResult> {
  const db = await getDb();
  const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
  if (!lead) return { ok: false, toast: 'Заявка не найдена' };

  // First press wins; later presses are acknowledged but change nothing.
  if (lead.status !== 'new') {
    return { ok: true, toast: `Уже в работе: ${STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status}` };
  }

  const actorName = actor?.name ?? 'менеджер';
  // Link the Telegram staff member to an admin user with the same name, if any.
  const adminRows = actor
    ? await db.select().from(users).where(eq(users.name, actor.name)).limit(1)
    : [];

  try {
    await changeLeadStatus({
      leadId,
      to: 'taken',
      actorType: 'staff',
      actorId: actor?.telegramId ?? null,
      actorName,
      channel: 'telegram',
      assigneeId: adminRows[0]?.id ?? null,
    });
  } catch {
    return { ok: false, toast: 'Не удалось изменить статус' };
  }

  return { ok: true, toast: `Взял в работу: ${actorName}`, updateCard: true };
}

async function spamLead(leadId: number, actor: StaffRecord | null): Promise<CardActionResult> {
  try {
    await changeLeadStatus({
      leadId,
      to: 'spam',
      actorType: 'staff',
      actorId: actor?.telegramId ?? null,
      actorName: actor?.name ?? 'менеджер',
      channel: 'telegram',
    });
  } catch {
    return { ok: false, toast: 'Не удалось изменить статус' };
  }
  return { ok: true, toast: 'Помечено как спам', updateCard: true };
}

async function setStatus(leadId: number, status: LeadStatus, actor: StaffRecord | null): Promise<CardActionResult> {
  try {
    await changeLeadStatus({
      leadId,
      to: status,
      actorType: 'staff',
      actorId: actor?.telegramId ?? null,
      actorName: actor?.name ?? 'менеджер',
      channel: 'telegram',
      // A "lost" transition reached from the status keyboard always needs a reason.
      lostReason: status === 'lost' ? 'other' : undefined,
    });
  } catch (error) {
    const message = (error as LeadError).message ?? 'Не удалось изменить статус';
    return { ok: false, toast: message };
  }
  return { ok: true, toast: `Статус: ${STATUS_LABELS_RU[status]}`, updateCard: true };
}

async function bookSlot(leadId: number, iso: string, actor: StaffRecord | null): Promise<CardActionResult> {
  const lead = await (async () => {
    const db = await getDb();
    return (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
  })();
  if (!lead) return { ok: false, toast: 'Заявка не найдена' };

  try {
    await requestMeasurement({
      leadId,
      startsAt: new Date(iso),
      address: lead.address ?? '',
      district: lead.district,
      actor: actor?.name ?? 'менеджер',
    });
  } catch (error) {
    return { ok: false, toast: error instanceof SlotError ? error.message : 'Не удалось назначить замер' };
  }

  // The confirmation text is produced for a human to send from WhatsApp (§8.5).
  const startText = formatDateTimeRu(new Date(iso));
  const [day, time] = startText.split(', ');
  void waTemplates.measureConfirm({
    name: lead.name,
    date: day ?? '',
    time: time ?? '',
    address: lead.address ?? 'уточним',
  });

  return { ok: true, toast: `Замер: ${startText}`, updateCard: true };
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const db = await getDb();

  /* ------------------------------- callbacks ---------------------------- */
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const actor = await findStaff(query.from.id);
    const [prefix, action, ...rest] = (query.data ?? '').split(':');

    if (!actor) {
      await answerCallbackQuery(query.id, 'Нет доступа. Попросите код у владельца.');
      return;
    }

    const leadId = Number.parseInt(rest[0] ?? '', 10);
    let result: CardActionResult = { ok: true };

    if (prefix === 'l') {
      switch (action) {
        case 't':
          result = await takeLead(leadId, actor);
          break;
        case 'c': {
          const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
          if (lead && chatId) {
            await reply(chatId, `📞 ${lead.name}: ${formatPhone(lead.phoneNormalized)}`);
          }
          result = { ok: true, toast: 'Номер отправлен в чат' };
          break;
        }
        case 'w': {
          const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
          if (lead && chatId) {
            const text = waTemplates.site({ kind: lead.kind, district: lead.district ?? undefined });
            const url = `https://wa.me/${lead.phoneNormalized.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
            await reply(chatId, `💬 Написать клиенту в WhatsApp: ${url}`);
          }
          result = { ok: true, toast: 'Ссылка WhatsApp отправлена' };
          break;
        }
        case 'm': {
          const dayKey = localDayKey(new Date(Date.now() + 86_400_000));
          const slots = await getAvailableSlots(dayKey);
          if (chatId) {
            const buttons = slots.slice(0, 6).map((slot) => [
              { text: slot.label, callbackData: `ms:${leadId}:${slot.startsAt}` },
            ]);
            await reply(
              chatId,
              buttons.length > 0
                ? `📅 Свободное время на ${dayKey.split('-').reverse().join('.')}:`
                : `📅 На ${dayKey.split('-').reverse().join('.')} свободных слотов нет. Откройте админку и выберите другой день.`,
              buttons.length > 0 ? buttons : undefined,
            );
          }
          result = { ok: true, toast: 'Слоты отправлены' };
          break;
        }
        case 's': {
          if (chatId) {
            const statuses: LeadStatus[] = ['contacted', 'quote_sent', 'won', 'lost'];
            const buttons = statuses.map((status) => [
              { text: STATUS_LABELS_RU[status], callbackData: `st:${status}:${leadId}` },
            ]);
            await reply(chatId, `🔄 Новый статус заявки #${leadId}:`, buttons);
          }
          result = { ok: true, toast: 'Выберите статус' };
          break;
        }
        case 'x':
          result = await spamLead(leadId, actor);
          break;
        default:
          result = { ok: false, toast: 'Неизвестное действие' };
      }
    } else if (prefix === 'st') {
      const status = rest[0] ?? '';
      const id = Number.parseInt(rest[1] ?? '', 10);
      result = isLeadStatus(status) ? await setStatus(id, status, actor) : { ok: false, toast: 'Неизвестный статус' };
    } else if (prefix === 'ms') {
      const iso = rest.slice(1).join(':');
      result = await bookSlot(leadId, iso, actor);
    }

    await answerCallbackQuery(query.id, result.toast);

    if (result.updateCard && chatId && messageId && result.ok) {
      const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
      if (lead) {
        await telegramNotifier.send({
          kind: 'telegram',
          chatId: String(chatId),
          editMessageId: messageId,
          text: leadCardText(lead),
          buttons: leadCardButtons(lead.id),
        });
      }
    }
    return;
  }

  /* ------------------------------- messages ----------------------------- */
  const message = update.message;
  if (!message?.text) return;
  const text = message.text.trim();
  const chatId = message.chat.id;
  const fromName = message.from?.first_name ?? 'Сотрудник';

  // `/start CODE` registers a staff member.
  if (text.startsWith('/start')) {
    const code = text.split(/\s+/)[1];
    if (code) {
      const registered = await registerWithCode(message.from?.id ?? 0, code, fromName);
      await reply(
        chatId,
        registered
          ? `Готово, ${registered.name}. Роль: ${registered.role}. Карточки заявок будут приходить сюда. Команда /help.`
          : 'Код не найден или уже использован. Попросите новый код в админке.',
      );
      return;
    }
    await reply(chatId, 'Отправьте одноразовый код из админки: /start КОД');
    return;
  }

  const actor = await findStaff(message.from?.id ?? 0);
  if (!actor) {
    await reply(chatId, 'Нет доступа. Отправьте код приглашения: /start КОД');
    return;
  }

  const [command, ...args] = text.split(/\s+/);

  switch (command) {
    case '/help':
      await reply(
        chatId,
        [
          'Команды:',
          '/new — последние новые заявки',
          '/my — заявки в работе',
          '/today — заявки за сегодня',
          '/week — заявки за неделю',
          '/stats — сводка',
          '/find +7… — поиск по номеру',
          '/help — эта справка',
        ].join('\n'),
      );
      return;

    case '/new': {
      const { rows } = await listLeads({ status: ['new'], limit: 10 });
      await reply(chatId, rows.length ? summarise(rows) : 'Новых заявок нет.');
      return;
    }

    case '/my': {
      const { rows } = await listLeads({
        status: ['taken', 'contacted', 'measure_booked', 'measured', 'quote_sent'],
        limit: 10,
      });
      await reply(chatId, rows.length ? summarise(rows) : 'Заявок в работе нет.');
      return;
    }

    case '/today': {
      const since = new Date(Date.now() - 86_400_000);
      const db2 = await getDb();
      const rows = await db2
        .select()
        .from(leads)
        .where(gte(leads.createdAt, since))
        .orderBy(desc(leads.createdAt))
        .limit(15);
      await reply(chatId, rows.length ? summarise(rows) : 'За сегодня заявок нет.');
      return;
    }

    case '/week': {
      const since = new Date(Date.now() - 7 * 86_400_000);
      const db2 = await getDb();
      const rows = await db2
        .select()
        .from(leads)
        .where(gte(leads.createdAt, since))
        .orderBy(desc(leads.createdAt))
        .limit(20);
      await reply(chatId, rows.length ? summarise(rows) : 'За неделю заявок нет.');
      return;
    }

    case '/stats': {
      const stats = await leadStats();
      const unanswered = await findUnansweredLeads(60);
      await reply(
        chatId,
        [
          `Заявок: сегодня ${stats.today}, за неделю ${stats.week}, за месяц ${stats.month}`,
          `Без ответа больше часа: ${unanswered.length}`,
          `Среднее время первой реакции: ${stats.avgFirstResponseMinutes ?? '—'} мин`,
          `Конверсия в договор: ${stats.conversion ?? '—'}%`,
          '',
          'По источникам:',
          ...stats.bySource.map((row) => `• ${row.source}: ${row.count}`),
        ].join('\n'),
      );
      return;
    }

    case '/find': {
      const normalised = normalizePhone(args.join(' '));
      if (!normalised) {
        await reply(chatId, 'Не понял номер. Пример: /find +7 700 107 49 27');
        return;
      }
      const db2 = await getDb();
      const rows = await db2
        .select()
        .from(leads)
        .where(or(eq(leads.phoneNormalized, normalised), like(leads.phoneNormalized, `%${normalised.slice(-7)}`)))
        .orderBy(desc(leads.createdAt))
        .limit(5);
      await reply(chatId, rows.length ? summarise(rows) : `Заявок по номеру ${formatPhone(normalised)} нет.`);
      return;
    }

    default:
      await reply(chatId, `Неизвестная команда. /help\nТелефон компании: ${contacts.phonePrimary}`);
  }
}

function summarise(rows: Array<{ id: number; name: string; kind: string; status: string; district: string | null; createdAt: Date }>): string {
  return rows
    .map(
      (row) =>
        `#${row.id} · ${row.name} · ${row.kind} · ${STATUS_LABELS_RU[row.status as LeadStatus] ?? row.status}` +
        `${row.district ? ` · ${row.district}` : ''} · ${formatDateTimeRu(row.createdAt)}`,
    )
    .join('\n');
}

export { findStaff };
