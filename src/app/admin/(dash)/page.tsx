import Link from 'next/link';

import { getDb } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getUnconfirmedClaims } from '@/lib/domain/claims';
import { leadStats, listLeads } from '@/lib/domain/leads';
import { listUpcomingMeasurements } from '@/lib/domain/slots';
import { outboxHealth } from '@/lib/notify/outbox';
import { SOURCE_LABELS_RU, type LeadSource } from '@/lib/domain/sources';
import { STATUS_LABELS_RU, type LeadStatus } from '@/lib/domain/statuses';
import { formatDateTimeRu } from '@/lib/domain/time';
import { KIND_LABELS_RU } from '@/lib/domain/validation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = await leadStats();
  const db = await getDb();
  const recent = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(8);
  const measurements = await listUpcomingMeasurements(8);
  const health = await outboxHealth();
  const unconfirmed = await getUnconfirmedClaims();
  const { rows: unanswered } = await listLeads({ onlyUnanswered: true, limit: 5 });

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Заявок сегодня', value: stats.today },
          { label: 'За неделю', value: stats.week },
          { label: 'За месяц', value: stats.month },
          { label: 'Без первого ответа', value: stats.unanswered },
          { label: 'Средняя первая реакция, мин', value: stats.avgFirstResponseMinutes ?? '—' },
          { label: 'Конверсия в договор, %', value: stats.conversion ?? '—' },
          { label: 'Уведомлений в очереди', value: health.pending },
          { label: 'Уведомлений с ошибкой', value: health.failed },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="hint">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      {health.failed > 0 ? (
        <p className="rounded-lg border border-[#f0d9c8] bg-[#fdf6f1] p-3 text-sm text-danger">
          Есть недоставленные уведомления. Проверьте токен Telegram и адрес email в разделе «Уведомления».
        </p>
      ) : null}

      {unconfirmed.length > 0 ? (
        <p className="rounded-lg border border-line bg-surface p-3 text-sm">
          Ждут ответа владельца: <strong>{unconfirmed.length}</strong> утверждений.{' '}
          <Link href="/admin/claims" className="font-semibold text-glass underline">
            Открыть чек-лист
          </Link>
        </p>
      ) : null}

      {unanswered.length > 0 ? (
        <section className="card">
          <h2 className="font-semibold">Заявки без первого ответа</h2>
          <ul className="mt-3 divide-y divide-line">
            {unanswered.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  #{lead.id} · {lead.name} · {lead.phoneNormalized}
                </span>
                <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-glass underline">
                  Открыть
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold">Последние заявки</h2>
          <ul className="mt-3 divide-y divide-line">
            {recent.length === 0 ? <li className="py-2 hint">Заявок пока нет.</li> : null}
            {recent.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  #{lead.id} · {lead.name} · {KIND_LABELS_RU[lead.kind as never] ?? lead.kind} ·{' '}
                  {STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status}
                </span>
                <span className="hint">{formatDateTimeRu(lead.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-semibold">Ближайшие замеры</h2>
          <ul className="mt-3 divide-y divide-line">
            {measurements.length === 0 ? <li className="py-2 hint">Замеров не назначено.</li> : null}
            {measurements.map((measurement) => (
              <li key={measurement.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {formatDateTimeRu(measurement.startsAt)} · {measurement.address || 'адрес уточняется'}
                </span>
                <span className="hint">{measurement.status === 'confirmed' ? 'подтверждён' : 'ожидает'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-semibold">Источники</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {stats.bySource.length === 0 ? <li className="hint">Пока нет данных.</li> : null}
            {stats.bySource.map((row) => (
              <li key={row.source} className="flex justify-between">
                <span>{SOURCE_LABELS_RU[row.source as LeadSource] ?? row.source}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-semibold">Виды конструкций</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {stats.byKind.length === 0 ? <li className="hint">Пока нет данных.</li> : null}
            {stats.byKind.map((row) => (
              <li key={row.kind} className="flex justify-between">
                <span>{KIND_LABELS_RU[row.kind as never] ?? row.kind}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2 className="font-semibold">Воронка по статусам</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stats.byStatus.map((row) => (
            <li key={row.status} className="flex justify-between rounded border border-line px-3 py-2 text-sm">
              <span>{STATUS_LABELS_RU[row.status as LeadStatus] ?? row.status}</span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
