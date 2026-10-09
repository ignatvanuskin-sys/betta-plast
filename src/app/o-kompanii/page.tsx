import type { Metadata } from 'next';

import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  CtaBlock,
  LocalBusinessSchema,
  WhyUs,
} from '@/components/sections';
import { company, contacts } from '@/lib/config';
import { ratingLine, getRating } from '@/lib/domain/settings';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES['o-kompanii'].title,
  description: PAGES['o-kompanii'].description,
  alternates: { canonical: '/o-kompanii' },
};

export const dynamic = 'force-dynamic';

export default async function OKompaniiPage() {
  const rating = await getRating();

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'О компании' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'О компании' }]} />

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-bold md:text-4xl">О компании</h1>
          <p className="mt-4 text-lg text-ink-soft">
            {company.nameRu} — {company.legalNameRu.toLowerCase()}. {company.cityRu}, {company.addressRu}.
          </p>
          <p className="mt-4 text-ink-soft">{company.taglineRu}.</p>

          <h2 className="mt-10 text-2xl font-bold">Чем занимаемся</h2>
          <ul className="mt-4 space-y-2 text-ink-soft">
            <li>Пластиковые окна для квартир и частных домов.</li>
            <li>Остекление и отделка балконов и лоджий.</li>
            <li>Перегородки и витрины для бутиков, магазинов и офисов.</li>
            <li>Ремонт и регулировка окон и балконных дверей.</li>
          </ul>
          <p className="hint mt-4">
            Перечень услуг взят из рубрик карточки в 2ГИС. Точный состав работ по вашему объекту подтвердит менеджер.
          </p>

          <h2 className="mt-10 text-2xl font-bold">Рейтинг и отзывы</h2>
          <p className="mt-3 text-ink-soft">
            {ratingLine(rating)} —{' '}
            <a href={contacts.gisReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-glass underline">
              смотреть отзывы в 2ГИС
            </a>
            . Компания отвечает на отзывы в 2ГИС, включая критические: это часть работы, а не разовая акция.
          </p>

          <h2 className="mt-10 text-2xl font-bold">Чего мы не пишем на сайте</h2>
          <p className="mt-3 text-ink-soft">
            Мы не публикуем сведения, которые владелец не подтвердил: конкретные сроки гарантии, условия рассрочки,
            бренды профилей и фурнитуры, год основания, прайс. Если чего-то нет — значит, это пока не проверено, и
            лучше уточнить у менеджера, чем получить неточность на сайте.
          </p>
        </div>
      </section>

      <WhyUs
        items={[
          { title: 'Работаем по заявке', text: 'Заявка с сайта сразу попадает менеджеру, ничего не теряется.' },
          { title: 'Стоимость после замера', text: 'Считаем по фактическим размерам, а не «на глаз».' },
          { title: 'Балконы и окна', text: 'От одной створки до балкона под ключ.' },
          { title: 'Организациям', text: 'Окна, перегородки, витрины; оплата через банк.' },
        ]}
      />

      <CtaBlock title="Обсудим ваш объект?" text="Оставьте заявку — менеджер свяжется в рабочее время." formKind="quick" />
      <ContactBlock />
    </>
  );
}
