import Link from 'next/link';

import { listLeads } from '@/lib/domain/leads';
import { SOURCE_LABELS_RU, type LeadSource } from '@/lib/domain/sources';
import { LEAD_STATUSES, STATUS_LABELS_RU, type LeadStatus } from '@/lib/domain/statuses';
import { formatDateTimeRu } from '@/lib/domain/time';
import { KIND_LABELS_RU } from '@/lib/domain/validation';
import { LEAD_KINDS } from '@/lib/domain/validation';

export const dynamic = 'force-dynamic';

type SearchParams = { status?: string; source?: string; kind?: string; q?: string; unanswered?: string };

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const statuses = (params.status ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is LeadStatus => (LEAD_STATUSES as readonly string[]).includes(value));

  const { rows, total } = await listLeads({
    status: statuses.length > 0 ? statuses : undefined,
    source: params.source || undefined,
    kind: params.kind || undefined,
    search: params.q || undefined,
    onlyUnanswered: params.unanswered === '1',
    limit: 100,
  });

  const buildHref = (patch: Partial<SearchParams>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, String(value));
    }
    const query = next.toString();
    return `/admin/leads${query ? `?${query}` : ''}`;
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Заявки ({total})</h1>

      <div className="card">
        <form className="grid gap-3 sm:grid-cols-4" method="get">
          <div>
            <label className="label" htmlFor="q">
              Поиск по имени или телефону
            </label>
            <input id="q" name="q" defaultValue={params.q ?? ''} className="field" inputMode="search" />
          </div>
          <div>
            <label className="label" htmlFor="status">
              Статус
            </label>
            <select id="status" name="status" defaultValue={params.status ?? ''} className="field">
              <option value="">Все</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS_RU[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="kind">
              Тип
            </label>
            <select id="kind" name="kind" defaultValue={params.kind ?? ''} className="field">
              <option value="">Все</option>
              {LEAD_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS_RU[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-cta w-full">
              Показать
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href={buildHref({ unanswered: params.unanswered === '1' ? '' : '1' })} className="font-semibold text-glass underline">
            {params.unanswered === '1' ? 'Показать все' : 'Только без первого ответа'}
          </Link>
          <Link href="/admin/leads" className="text-ink-soft underline">
            Сбросить фильтры
          </Link>
          <a href="/api/admin/leads.csv" className="text-ink-soft underline">
            Экспорт CSV
          </a>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2">#</th>
              <th className="py-2">Клиент</th>
              <th className="py-2">Тип</th>
              <th className="py-2">Статус</th>
              <th className="py-2">Источник</th>
              <th className="py-2">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted">
                  Заявок по этому фильтру нет.
                </td>
              </tr>
            ) : null}
            {rows.map((lead) => (
              <tr key={lead.id}>
                <td className="py-2">
                  <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-glass underline">
                    {lead.id}
                  </Link>
                </td>
                <td className="py-2">
                  {lead.name}
                  <span className="block hint">{lead.phoneNormalized}</span>
                </td>
                <td className="py-2">{KIND_LABELS_RU[lead.kind as never] ?? lead.kind}</td>
                <td className="py-2">{STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status}</td>
                <td className="py-2">{SOURCE_LABELS_RU[lead.source as LeadSource] ?? lead.source}</td>
                <td className="py-2">{formatDateTimeRu(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
