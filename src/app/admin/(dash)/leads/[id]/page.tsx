import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  addNoteAction,
  bookMeasurementAction,
  deleteLeadAction,
  updateLeadStatusAction,
} from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { getCurrentUser, hasRole } from '@/lib/auth/session';
import { describeCalc } from '@/lib/domain/catalog';
import { getLead, getLeadFiles, getLeadTimeline } from '@/lib/domain/leads';
import { formatPhone } from '@/lib/domain/phone';
import { SOURCE_LABELS_RU, type LeadSource } from '@/lib/domain/sources';
import {
  allowedTransitions,
  LOST_REASON_LABELS_RU,
  LOST_REASONS,
  STATUS_LABELS_RU,
  type LeadStatus,
} from '@/lib/domain/statuses';
import { formatDateTimeRu } from '@/lib/domain/time';
import { KIND_LABELS_RU } from '@/lib/domain/validation';
import { waTemplates } from '@/lib/notify/messages';

export const dynamic = 'force-dynamic';

export default async function LeadCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leadId = Number.parseInt(id, 10);
  if (!Number.isFinite(leadId)) notFound();

  const lead = await getLead(leadId);
  if (!lead) notFound();

  const [timeline, files, user] = await Promise.all([getLeadTimeline(leadId), getLeadFiles(leadId), getCurrentUser()]);
  const transitions = allowedTransitions(lead.status as LeadStatus);
  const summary = describeCalc(lead.kind as never, lead.calcPayload ?? undefined);

  const waHref = `https://wa.me/${lead.phoneNormalized.replace(/\D/g, '')}?text=${encodeURIComponent(
    waTemplates.site({ kind: lead.kind, district: lead.district ?? undefined }),
  )}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          Заявка #{lead.id} · {KIND_LABELS_RU[lead.kind as never] ?? lead.kind}
        </h1>
        <Link href="/admin/leads" className="text-sm text-glass underline">
          Все заявки
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="card">
          <h2 className="font-semibold">Клиент</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="hint">Имя</dt>
              <dd className="font-medium">{lead.name}</dd>
            </div>
            <div>
              <dt className="hint">Телефон</dt>
              <dd className="font-medium">{formatPhone(lead.phoneNormalized)}</dd>
            </div>
            {lead.organization ? (
              <div>
                <dt className="hint">Организация</dt>
                <dd>{lead.organization}</dd>
              </div>
            ) : null}
            {lead.email ? (
              <div>
                <dt className="hint">Email</dt>
                <dd>{lead.email}</dd>
              </div>
            ) : null}
            <div>
              <dt className="hint">Район</dt>
              <dd>{lead.district ?? '—'}</dd>
            </div>
            <div>
              <dt className="hint">Адрес</dt>
              <dd>{lead.address ?? '—'}</dd>
            </div>
            <div>
              <dt className="hint">Связь</dt>
              <dd>{lead.preferredContact === 'whatsapp' ? 'WhatsApp' : lead.preferredContact === 'any' ? 'Как удобно' : 'Звонок'}</dd>
            </div>
            <div>
              <dt className="hint">Источник</dt>
              <dd>
                {SOURCE_LABELS_RU[lead.source as LeadSource] ?? lead.source}
                {lead.pagePath ? <span className="block hint">{lead.pagePath}</span> : null}
              </dd>
            </div>
            <div>
              <dt className="hint">Получена</dt>
              <dd>{formatDateTimeRu(lead.createdAt)}</dd>
            </div>
            <div>
              <dt className="hint">Первая реакция</dt>
              <dd>{lead.firstResponseAt ? formatDateTimeRu(lead.firstResponseAt) : 'ещё не было'}</dd>
            </div>
            <div>
              <dt className="hint">Согласие на ПД</dt>
              <dd>
                {lead.consentAt ? `${formatDateTimeRu(lead.consentAt)} · версия ${lead.consentVersion ?? '—'}` : 'нет'}
              </dd>
            </div>
          </dl>

          {summary ? (
            <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">
              <p className="hint">Параметры конструкции</p>
              <p className="font-medium">{summary}</p>
            </div>
          ) : null}

          {lead.comment ? (
            <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
              <p className="hint">Комментарий клиента</p>
              <p>{lead.comment}</p>
            </div>
          ) : null}

          {files.length > 0 ? (
            <div className="mt-4">
              <p className="hint">Файлы клиента</p>
              <ul className="mt-1 space-y-1 text-sm">
                {files.map((file) => (
                  <li key={file.id}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-glass underline">
                      {file.fileName}
                    </a>{' '}
                    <span className="hint">{Math.round(file.size / 1024)} КБ</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`tel:${lead.phoneNormalized.replace(/[^\d+]/g, '')}`} className="btn btn-outline py-2 text-sm">
              Позвонить
            </a>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa py-2 text-sm">
              WhatsApp
            </a>
            <a href={lead.statusToken ? `/status/${lead.statusToken}` : '#'} className="btn btn-outline py-2 text-sm">
              Статус для клиента
            </a>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="card">
            <h2 className="font-semibold">Статус: {STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status}</h2>
            <ActionForm action={updateLeadStatusAction} submitLabel="Изменить статус" className="mt-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <label className="label" htmlFor="status">
                Новый статус
              </label>
              <select id="status" name="status" className="field" defaultValue={transitions[0] ?? ''}>
                {transitions.length === 0 ? <option value="">Нет доступных переходов</option> : null}
                {transitions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS_RU[status]}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <label className="label" htmlFor="lostReason">
                  Причина отказа (если «Отказ»)
                </label>
                <select id="lostReason" name="lostReason" className="field" defaultValue="">
                  <option value="">—</option>
                  {LOST_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {LOST_REASON_LABELS_RU[reason]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="label" htmlFor="note">
                  Комментарий <span className="hint">(необязательно)</span>
                </label>
                <textarea id="note" name="note" className="field min-h-16" />
              </div>
            </ActionForm>
          </section>

          <section className="card">
            <h2 className="font-semibold">Назначить замер</h2>
            <ActionForm action={bookMeasurementAction} submitLabel="Назначить" className="mt-3" variant="outline">
              <input type="hidden" name="leadId" value={lead.id} />
              <label className="label" htmlFor="startsAt">
                Дата и время (Asia/Almaty)
              </label>
              <input id="startsAt" name="startsAt" type="datetime-local" className="field" required />
              <div className="mt-3">
                <label className="label" htmlFor="address">
                  Адрес
                </label>
                <input id="address" name="address" className="field" defaultValue={lead.address ?? ''} />
              </div>
            </ActionForm>
            <p className="hint mt-2">
              Запись создаётся со статусом «ожидает» — клиенту ничего не отправляется автоматически. Подтверждение
              отправляйте сами из WhatsApp.
            </p>
          </section>

          <section className="card">
            <h2 className="font-semibold">Заметка</h2>
            <ActionForm action={addNoteAction} submitLabel="Добавить" className="mt-3" variant="outline">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea name="text" className="field min-h-16" placeholder="Например: договорились на вторник" />
            </ActionForm>
          </section>

          {hasRole(user, 'owner') ? (
            <section className="card">
              <h2 className="font-semibold">Удаление данных клиента</h2>
              <p className="hint mt-1">
                Удаляет заявку, вложения, историю и поставленные уведомления. Действие необратимо — выполняется по
                запросу клиента.
              </p>
              <ActionForm
                action={deleteLeadAction}
                submitLabel="Удалить данные"
                className="mt-3"
                variant="danger"
                confirm="Удалить данные клиента без возможности восстановления?"
              >
                <input type="hidden" name="leadId" value={lead.id} />
              </ActionForm>
            </section>
          ) : null}
        </div>
      </div>

      <section className="card">
        <h2 className="font-semibold">История</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {timeline.map((event) => (
            <li key={event.id} className="flex flex-wrap items-baseline gap-2 border-b border-line pb-2">
              <span className="hint">{formatDateTimeRu(event.createdAt)}</span>
              <span className="font-medium">
                {event.type === 'status_changed'
                  ? `${STATUS_LABELS_RU[event.fromStatus as LeadStatus] ?? event.fromStatus} → ${
                      STATUS_LABELS_RU[event.toStatus as LeadStatus] ?? event.toStatus
                    }`
                  : event.type === 'note'
                    ? `Заметка: ${String((event.meta as { text?: string } | null)?.text ?? '')}`
                    : event.type}
              </span>
              <span className="hint">
                {event.actorName ?? 'система'}
                {event.channel ? ` · ${event.channel}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
