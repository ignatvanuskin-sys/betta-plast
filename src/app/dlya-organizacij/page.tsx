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
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES['dlya-organizacij'].title,
  description: PAGES['dlya-organizacij'].description,
  alternates: { canonical: '/dlya-organizacij' },
};

const FAQ: FaqItem[] = [
  {
    question: 'Какой порядок работы с организацией?',
    answer:
      'Заявка с реквизитами и объёмом → уточнение деталей → расчёт → согласование и работы. Точный порядок и оформление документов менеджер подтвердит в переписке.',
    needsManager: true,
  },
  {
    question: 'Можно ли оплатить по безналичному расчёту?',
    answer: 'Да, оплата через банк возможна — это указано в карточке компании. Уточните детали у менеджера.',
  },
  {
    question: 'Что приложить к заявке?',
    answer:
      'Чертёж или спецификацию, если они есть: форматы PDF, JPG, DWG до 15 МБ. Если документов нет — опишите объём словами.',
  },
  {
    question: 'Бывают ли отсрочки и объёмные скидки?',
    answer: 'Уточните у менеджера — условия зависят от объёма и типа конструкций.',
    needsManager: true,
  },
];

export default function DlyaOrganizacijPage() {
  return (
    <>
      <LocalBusinessSchema areaServed="Караганда, Темиртау и область" />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Для организаций' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Для организаций' }]} />

      <Hero
        compact
        h1="Окна, перегородки и витрины для организаций"
        subtitle="Магазины, бутики, офисы, производственные помещения. Приложите спецификацию или чертёж — подготовим расчёт."
        primary={{ href: '#zayavka', label: 'Запросить расчёт' }}
      />

      <section className="section">
        <div className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Окна для помещений', text: 'Замена и установка окон в офисах, магазинах и цехах.' },
            { title: 'Перегородки и витрины', text: 'Зонирование торговых залов, кабинеты, витрины.' },
            { title: 'Входные группы', text: 'Обсуждаем индивидуально по вашему объекту.' },
            { title: 'Безналичный расчёт', text: 'Оплата через банк; оформление документов — уточняется.' },
          ].map((item) => (
            <div key={item.title} className="card">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-surface-2">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold md:text-3xl">Что указать в заявке</h2>
          <ul className="mt-4 space-y-2 text-ink-soft">
            <li>Название организации и контактное лицо.</li>
            <li>Тип объекта: магазин, офис, склад, производство.</li>
            <li>Объём: количество окон, метров перегородок, размеры.</li>
            <li>Желаемые сроки.</li>
            <li>Файл: чертёж или спецификация (PDF/JPG/DWG до 15 МБ).</li>
          </ul>
        </div>
      </section>

      <section className="section" id="zayavka">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Заявка от организации</h2>
            <p className="mt-3 text-ink-soft">
              Заявка приходит в общий поток с отметкой «B2B» и повышенным приоритетом — ей занимаются в первую очередь.
            </p>
          </div>
          <div className="card">
            <LeadForm
              formKind="b2b"
              segment="b2b"
              defaultKind="other"
              showKindSelect
              showOrganization
              showEmail
              showDistrict={false}
              showComment
              allowFiles
              commentLabel="Объём и задача"
              commentPlaceholder="Например: 24 окна в цехе, 45 м перегородок в торговом зале"
              submitLabel="Отправить заявку"
            />
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
