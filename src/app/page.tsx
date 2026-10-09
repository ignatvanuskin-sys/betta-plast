import Link from 'next/link';
import type { Metadata } from 'next';

import { GalleryGrid } from '@/components/Gallery';
import { LeadForm } from '@/components/LeadForm';
import {
  BalconyHighlight,
  ContactBlock,
  FaqBlock,
  FaqSchema,
  Hero,
  LocalBusinessSchema,
  ServiceTiles,
  Steps,
  TrustRow,
  WhyUs,
} from '@/components/sections';
import { FAQ_ITEMS } from '@/lib/content/faq';
import { getGallery, REVIEW_THEMES } from '@/lib/domain/content';
import { getRating, ratingLine } from '@/lib/domain/settings';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.home.title,
  description: PAGES.home.description,
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

const SERVICES = [
  {
    href: '/okna',
    title: 'Пластиковые окна',
    text: 'Для квартир и домов: замер, изготовление, монтаж.',
    icon: 'window' as const,
  },
  {
    href: '/balkony',
    title: 'Балконы и лоджии',
    text: 'Остекление, утепление, отделка, откосы, шкаф.',
    icon: 'balcony' as const,
  },
  {
    href: '/peregorodki',
    title: 'Перегородки',
    text: 'Для бутиков, магазинов и офисов. Эскиз по вашему размеру.',
    icon: 'partition' as const,
  },
  {
    href: '/remont-okon',
    title: 'Ремонт окон',
    text: 'Не закрывается, дует, сломана ручка — починим.',
    icon: 'repair' as const,
  },
];

const STEPS = [
  { title: 'Заявка', text: 'Форма на сайте, звонок или WhatsApp. Данные сразу у менеджера.' },
  { title: 'Замер и консультация', text: 'Приезжаем на объект, замеряем и обсуждаем варианты.' },
  { title: 'Расчёт и договор', text: 'Называем стоимость после замера, фиксируем условия.' },
  { title: 'Изготовление', text: 'Конструкции делаются по вашим размерам.' },
  { title: 'Монтаж и акт', text: 'Доставка, установка, уборка и подписание акта.' },
];

const WHY_US = [
  { title: 'Производственная компания', text: 'В 2ГИС тип предприятия указан как «Производство».' },
  { title: 'Стоимость после замера', text: 'Считаем по фактическим размерам, без «сюрпризов» в договоре.' },
  { title: 'Рейтинг в 2ГИС', text: 'Клиенты ставят высокие оценки и отмечают аккуратный монтаж.' },
  { title: 'Доставка', text: 'Привозим конструкции на объект.' },
];

export default async function HomePage() {
  const rating = await getRating();
  const gallery = await getGallery({ onlyHome: true, limit: 8 });

  return (
    <>
      <LocalBusinessSchema />
      <FaqSchema items={FAQ_ITEMS.slice(0, 6)} />

      <Hero
        h1="Пластиковые окна и балконы под ключ в Караганде"
        subtitle="Производство, замер, установка. Окна, остекление балконов, перегородки, ремонт."
      />
      <TrustRow rating={rating} />

      <ServiceTiles tiles={SERVICES} />

      <BalconyHighlight
        items={[
          'Остекление: холодное или тёплое',
          'Утепление и обшивка',
          'Откосы и отделка',
          'Встроенный шкаф или стеллаж',
          'Замер и монтаж',
          'Уборка после работ',
        ]}
      />

      <Steps steps={STEPS} />

      <WhyUs items={WHY_US} />

      {gallery.length > 0 ? (
        <section className="section">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-bold md:text-3xl">Наши работы</h2>
              <Link href="/raboty" className="font-semibold text-glass underline">
                Все работы
              </Link>
            </div>
            <div className="mt-6">
              <GalleryGrid items={gallery} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="section bg-surface-2">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">Отзывы</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {ratingLine(rating)}.{' '}
            <a
              href={rating.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-glass underline"
            >
              Все отзывы в 2ГИС
            </a>
          </p>
          <h3 className="mt-8 font-semibold">Что отмечают клиенты</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_THEMES.map((theme) => (
              <div key={theme.title} className="card">
                <p className="font-semibold">{theme.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{theme.text}</p>
              </div>
            ))}
          </div>
          <p className="hint mt-4">
            Это обобщение тем из отзывов, а не цитаты. Рейтинг и оценки — данные 2ГИС, ссылка на источник выше.
          </p>
        </div>
      </section>

      <section className="section bg-surface" id="zayavka">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Быстрая заявка</h2>
            <p className="mt-3 text-ink-soft">
              Оставьте имя и телефон — менеджер свяжется в рабочее время. Хотите быстрее — напишите в WhatsApp.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li>Стоимость считаем после замера — по вашим размерам.</li>
              <li>Работаем и с квартирами, и с организациями.</li>
              <li>Ремонт и регулировку можно заказать отдельно.</li>
            </ul>
          </div>
          <div className="card">
            <LeadForm formKind="quick" showKindSelect showDistrict showComment submitLabel="Получить расчёт" />
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ_ITEMS.slice(0, 6)} />
      <ContactBlock />
    </>
  );
}
