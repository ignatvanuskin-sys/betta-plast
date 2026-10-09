import { retryJobAction } from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { formatDateTimeRu } from '@/lib/domain/time';
import { listNotificationJobs } from '@/lib/notify/outbox';
import { telegram, email } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Journal of notifications (§9.9). Failed jobs are the place where a Telegram
 * outage becomes visible — a lead is never lost because of it.
 */
export default async function NotificationsPage() {
  const jobs = await listNotificationJobs(80);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Журнал уведомлений</h1>
      <p className="text-sm text-ink-soft">
        Telegram: {telegram.enabled ? 'подключён' : 'не настроен'} · Email-резерв: {email.enabled ? 'подключён' : 'не настроен'}
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2">#</th>
              <th className="py-2">Канал</th>
              <th className="py-2">Ключ</th>
              <th className="py-2">Статус</th>
              <th className="py-2">Попытки</th>
              <th className="py-2">Следующая попытка</th>
              <th className="py-2">Ошибка</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-4 text-center text-muted">
                  Уведомлений пока не было.
                </td>
              </tr>
            ) : null}
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="py-2">{job.id}</td>
                <td className="py-2">{job.channel}</td>
                <td className="py-2">
                  <span className="hint">{job.dedupeKey}</span>
                </td>
                <td className={`py-2 ${job.status === 'failed' ? 'font-semibold text-danger' : ''}`}>{job.status}</td>
                <td className="py-2">{job.attempts}</td>
                <td className="py-2">{formatDateTimeRu(job.nextAttemptAt)}</td>
                <td className="py-2 max-w-[220px] truncate text-danger">{job.lastError ?? ''}</td>
                <td className="py-2">
                  {job.status !== 'sent' ? (
                    <ActionForm action={retryJobAction} submitLabel="Повторить" variant="outline">
                      <input type="hidden" name="jobId" value={job.id} />
                    </ActionForm>
                  ) : (
                    <span className="hint">{job.sentAt ? formatDateTimeRu(job.sentAt) : ''}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
