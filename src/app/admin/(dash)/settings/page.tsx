import { changePasswordAction, saveRatingAction, saveReviewDelayAction } from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { getCurrentUser } from '@/lib/auth/session';
import { configurationWarnings, contacts, flags, site, storage } from '@/lib/config';
import { getSetting, getRating, SETTING_KEYS } from '@/lib/domain/settings';
import { storageDriverName } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** QR codes and ready-made links with `?src=` for the 2GIS card, Instagram, print (§8.6). */
const TRACKED_LINKS = [
  { label: 'Карточка 2ГИС', url: `${site.url}/?src=2gis` },
  { label: 'Шапка Instagram', url: `${site.url}/?src=instagram` },
  { label: 'WhatsApp', url: `${site.url}/?src=whatsapp` },
  { label: 'QR на замер', url: `${site.url}/zamer?src=qr-zamer` },
  { label: 'QR в цехе', url: `${site.url}/?src=qr-ceh` },
  { label: 'QR на визитке', url: `${site.url}/?src=qr-vizitka` },
];

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const { first } = await searchParams;
  const user = await getCurrentUser();
  const rating = await getRating();
  const reviewDelay = await getSetting<number>('review_request_delay_days', 2);
  const warnings = configurationWarnings();

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold">Настройки</h1>

      {first ? (
        <p className="rounded-lg border border-[#f0d9c8] bg-[#fdf6f1] p-3 text-sm text-warn">
          Это первый вход. Смените пароль ниже — до этого момента сайт не рекомендуется показывать клиентам.
        </p>
      ) : null}

      <section className="card">
        <h2 className="font-semibold">Пароль</h2>
        <p className="hint mt-1">Вход: {user?.email}</p>
        <ActionForm action={changePasswordAction} submitLabel="Сменить пароль" className="mt-3" variant="outline">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="password">
                Новый пароль (не короче 10 символов)
              </label>
              <input id="password" name="password" type="password" autoComplete="new-password" className="field" required />
            </div>
            <div>
              <label className="label" htmlFor="password2">
                Повторите пароль
              </label>
              <input id="password2" name="password2" type="password" autoComplete="new-password" className="field" required />
            </div>
          </div>
        </ActionForm>
      </section>

      <section className="card">
        <h2 className="font-semibold">Рейтинг 2ГИС</h2>
        <p className="hint mt-1">Обновляйте раз в месяц. На сайте он показывается как данные 2ГИС со ссылкой.</p>
        <ActionForm action={saveRatingAction} submitLabel="Сохранить" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="value">
                Рейтинг
              </label>
              <input id="value" name="value" className="field" defaultValue={String(rating.value).replace('.', ',')} />
            </div>
            <div>
              <label className="label" htmlFor="ratingsCount">
                Число оценок
              </label>
              <input id="ratingsCount" name="ratingsCount" className="field" defaultValue={rating.ratingsCount} />
            </div>
            <div>
              <label className="label" htmlFor="reviewsCount">
                Число отзывов
              </label>
              <input id="reviewsCount" name="reviewsCount" className="field" defaultValue={rating.reviewsCount} />
            </div>
            <div>
              <label className="label" htmlFor="checkedAt">
                Дата проверки
              </label>
              <input id="checkedAt" name="checkedAt" className="field" defaultValue={rating.checkedAt} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="url">
                Ссылка на отзывы
              </label>
              <input id="url" name="url" className="field" defaultValue={rating.url} />
            </div>
          </div>
        </ActionForm>
      </section>

      <section className="card">
        <h2 className="font-semibold">Просьба об отзыве</h2>
        <p className="hint mt-1">
          Через сколько дней после монтажа напоминать менеджеру. Сообщение клиенту всегда отправляет человек — бот
          ничего не рассылает.
        </p>
        <ActionForm action={saveReviewDelayAction} submitLabel="Сохранить" className="mt-3" variant="outline">
          <div className="max-w-[200px]">
            <label className="label" htmlFor="days">
              Дней после монтажа
            </label>
            <input id="days" name="days" type="number" min={0} max={30} className="field" defaultValue={reviewDelay} />
          </div>
        </ActionForm>
      </section>

      <section className="card">
        <h2 className="font-semibold">Ссылки для рекламы и QR-коды</h2>
        <p className="hint mt-1">
          Добавьте <code>?src=…</code> в ссылку — и в админке будет видно, откуда пришёл клиент.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {TRACKED_LINKS.map((link) => (
            <li key={link.url} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
              <span>{link.label}</span>
              <code className="hint break-all">{link.url}</code>
            </li>
          ))}
        </ul>
        <p className="hint mt-3">
          QR-код можно сгенерировать из любой из этих ссылок — например в 2ГИС или любом генераторе QR.
        </p>
      </section>

      <section className="card">
        <h2 className="font-semibold">Текущее состояние</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Сайт: {site.url}</li>
          <li>Часовой пояс: {site.timezone}</li>
          <li>Телефон: {contacts.phonePrimary} · WhatsApp: +{contacts.whatsapp}</li>
          <li>Режим цен: {flags.priceDisplay === 'off' ? 'цены не показываются' : 'диапазон после замера'}</li>
          <li>Казахская версия: {flags.kkEnabled ? 'включена' : 'выключена'}</li>
          <li>Страница статуса заказа: {flags.orderStatusPageEnabled ? 'включена' : 'выключена'}</li>
          <li>Хранилище файлов: {storageDriverName()}</li>
        </ul>
        {warnings.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warn">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card">
        <h2 className="font-semibold">Расписание cron</h2>
        <p className="hint mt-1">
          Защищённые эндпоинты вызываются планировщиком с заголовком{' '}
          <code>Authorization: Bearer CRON_SECRET</code>.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <code>/api/cron/outbox</code> — каждую минуту
          </li>
          <li>
            <code>/api/cron/sla</code> — каждые 5 минут
          </li>
          <li>
            <code>/api/cron/measure-reminders</code> — раз в час
          </li>
          <li>
            <code>/api/cron/review-requests</code> — раз в день
          </li>
          <li>
            <code>/api/cron/digest</code> — ежедневно в 09:00 Asia/Almaty
          </li>
          <li>
            <code>/api/cron/housekeeping</code> — раз в день
          </li>
        </ul>
      </section>
    </div>
  );
}
