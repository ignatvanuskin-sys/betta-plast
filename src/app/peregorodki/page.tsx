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
  title: PAGES.peregorodki.title,
  description: PAGES.peregorodki.description,
  alternates: { canonical: '/peregorodki' },
};

const TYPES = [
  { title: 'Раздвижные', text: 'Экономят место в узком помещении: бутик, коридор, зона примерочных.' },
  { title: 'Распашные', text: 'Привычная дверь в перегородке — удобно для офисов и кабинетов.' },
  { title: 'Глухие витрины', text: 'Стеклянная плоскость без открывания — для витрин и зонирования.' },
];

const FAQ: FaqItem[] = [
  {
    question: 'Можно ли сделать эскиз по моим размерам?',
    answer:
      'Да. Пришлите размеры проёма и фото помещения в WhatsApp или в форме ниже — менеджер подготовит эскиз и уточнит сроки.',
  },
  {
    question: 'Сколько стоит перегородка?',
    answer: 'Стоимость зависит от размера, типа открывания и количества. Точный расчёт менеджер сделает по вашим размерам.',
    needsManager: true,
  },
  {
    question: 'Работаете с организациями и по безналичному расчёту?',
    answer:
      'Да. Оставьте заявку на странице «Для организаций» и приложите спецификацию — оплата через банк возможна.',
  },
  {
    question: 'Сколько занимает изготовление и монтаж?',
    answer: 'Срок зависит от загрузки производства и объёма. Точные даты менеджер назовёт при расчёте.',
    needsManager: true,
  },
];

export default function PeregorodkiPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Перегородки' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Перегородки' }]} />

      <Hero
        compact
        h1="Перегородки для бутиков, магазинов и офисов"
        subtitle="ПВХ-перегородки, витрины и зонирование. Пришлите размеры — подготовим эскиз и расчёт."
        primary={{ href: '#zayavka', label: 'Запросить эскиз' }}
      />

      <section className="section">
        <div className="container-page grid gap-4 sm:grid-cols-3">
          {TYPES.map((item) => (
            <div key={item.title} className="card">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-surface-2">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold md:text-3xl">Что нужно от вас</h2>
          <ul className="mt-4 space-y-2 text-ink-soft">
            <li>Размеры проёма (ширина и высота) — примерные тоже подойдут.</li>
            <li>Фото помещения: где будет стоять перегородка и что рядом.</li>
            <li>Пожелания: нужна ли дверь, нужна ли витрина, как открывать.</li>
          </ul>
          <p className="hint mt-3">
            Если чертёж есть — приложите файл: PDF, JPG или DWG до 15 МБ. Это ускорит расчёт.
          </p>
        </div>
      </section>

      <section className="section bg-surface" id="zayavka">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Заявка на перегородку</h2>
            <p className="mt-3 text-ink-soft">
              Опишите задачу и приложите фото или файл. Менеджер свяжется, чтобы уточнить детали и подготовить эскиз.
            </p>
          </div>
          <div className="card">
            <LeadForm
              formKind="quick"
              defaultKind="partition"
              showDistrict
              showComment
              allowFiles
              commentLabel="Что нужно"
              commentPlaceholder="Например: перегородка в бутик 3,5 × 2,7 м с раздвижной дверью"
              submitLabel="Запросить эскиз"
            />
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
