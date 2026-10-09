import type { Metadata } from 'next';

import { LeadForm } from '@/components/LeadForm';
import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  FaqBlock,
  Hero,
  LocalBusinessSchema,
  type FaqItem,
} from '@/components/sections';
import { contacts } from '@/lib/config';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES['remont-okon'].title,
  description: PAGES['remont-okon'].description,
  alternates: { canonical: '/remont-okon' },
};

const ISSUES = [
  'Створка не закрывается или заедает',
  'Дует из-под створки или из-под подоконника',
  'Окно «плачет»: конденсат на стекле',
  'Сломана или прокручивается ручка',
  'Проблемы с балконной дверью',
  'Провисла створка, цепляет раму',
];

const FAQ: FaqItem[] = [
  {
    question: 'Сколько стоит ремонт или регулировка?',
    answer:
      'Зависит от того, что именно случилось: иногда достаточно регулировки, иногда нужна замена фурнитуры. Пришлите фото и описание — менеджер сориентирует.',
    needsManager: true,
  },
  {
    question: 'Чините ли окна, которые ставили не вы?',
    answer: 'Да, ремонтируем и регулируем окна других производителей — привозите фото или опишите проблему.',
  },
  {
    question: 'Как быстро приедет мастер?',
    answer: 'Зависит от загрузки. Уточните у менеджера — он назовёт ближайшее время.',
    needsManager: true,
  },
  {
    question: 'Можно ли заказать только регулировку одной створки?',
    answer: 'Да, отдельный выезд на одну створку — нормальная заявка, не нужно ждать «большого» заказа.',
  },
];

export default function RemontOkonPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Ремонт окон' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Ремонт окон' }]} />

      <Hero
        compact
        h1="Ремонт и регулировка окон и балконных дверей"
        subtitle="Не закрывается, дует, сломана ручка, «плачет» окно? Опишите проблему и приложите фото — мастер скажет, что делать."
        primary={{ href: '#zayavka', label: 'Оставить заявку на ремонт' }}
      />

      <section className="section">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">С чем обращаются</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ISSUES.map((issue) => (
              <li key={issue} className="card text-sm text-ink-soft">
                {issue}
              </li>
            ))}
          </ul>
          <p className="hint mt-4">
            Если вашего случая в списке нет — не страшно, опишите своими словами в форме. Разберёмся.
          </p>
        </div>
      </section>

      <section className="section bg-surface-2">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold md:text-3xl">Если нужно срочно</h2>
          <p className="mt-3 text-ink-soft">
            Ремонт обычно нужен «вчера». Позвоните или напишите в WhatsApp — это быстрее, чем форма. Заявку с сайта мы
            всё равно получим и поставим в приоритет.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={contacts.telHref} className="btn btn-outline">
              Позвонить {contacts.phonePrimary}
            </a>
            <a href={contacts.waHref} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="zayavka">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Заявка на ремонт</h2>
            <p className="mt-3 text-ink-soft">
              Приложите 1–3 фото: так мастер сразу поймёт, что случилось, и приедет с нужными деталями.
            </p>
          </div>
          <div className="card">
            <LeadForm
              formKind="repair"
              defaultKind="repair"
              showDistrict
              showComment
              allowFiles
              commentLabel="Что случилось"
              commentPlaceholder="Например: балконная дверь не закрывается до конца, дует снизу"
              submitLabel="Вызвать мастера"
              compact
            />
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
