import Link from 'next/link';

import { setMeasurementStatusAction } from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { listUpcomingMeasurements } from '@/lib/domain/slots';
import { formatDateTimeRu } from '@/lib/domain/time';
import { contacts } from '@/lib/config';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'ожидает подтверждения',
  confirmed: 'подтверждён',
  done: 'выполнен',
  cancelled: 'отменён',
};

export default async function AdminMeasurementsPage() {
  const items = await listUpcomingMeasurements(60);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Замеры</h1>
      <p className="text-sm text-ink-soft">
        Запись с сайта создаётся как «ожидает». Подтвердите её и отправьте клиенту сообщение из WhatsApp — кнопка
        «Подтвердить и написать» рядом.
      </p>

      <div className="grid gap-3">
        {items.length === 0 ? <p className="card hint">Замеров не назначено.</p> : null}
        {items.map((item) => {
          const [day, time] = formatDateTimeRu(item.startsAt).split(', ');
          const waText = `Здравствуйте! Подтверждаем замер ${day} в ${time}, адрес: ${
            item.address || 'уточним'
          }. Если планы изменятся — напишите нам. Бетта Пласт, ${contacts.phonePrimary}.`;
          const waHref = item.address
            ? `https://wa.me/?text=${encodeURIComponent(waText)}`
            : `https://wa.me/?text=${encodeURIComponent(waText)}`;

          return (
            <article key={item.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {formatDateTimeRu(item.startsAt)} · {STATUS_LABELS[item.status] ?? item.status}
                  </p>
                  <p className="hint">
                    Заявка{' '}
                    <Link href={`/admin/leads/${item.leadId}`} className="text-glass underline">
                      #{item.leadId}
                    </Link>{' '}
                    · {item.address || 'адрес уточняется'}
                    {item.district ? ` · ${item.district}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://2gis.kz/karaganda/search/${encodeURIComponent(item.address || 'Караганда')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline py-2 text-sm"
                  >
                    Открыть адрес
                  </a>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa py-2 text-sm">
                    Написать клиенту
                  </a>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {(['confirmed', 'done', 'cancelled'] as const).map((status) => (
                  <ActionForm
                    key={status}
                    action={setMeasurementStatusAction}
                    submitLabel={status === 'confirmed' ? 'Подтвердить' : status === 'done' ? 'Выполнен' : 'Отменить'}
                    variant="outline"
                  >
                    <input type="hidden" name="measurementId" value={item.id} />
                    <input type="hidden" name="status" value={status} />
                  </ActionForm>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
