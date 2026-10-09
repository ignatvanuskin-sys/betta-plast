import type { Metadata } from 'next';

import { Breadcrumbs, BreadcrumbSchema, CtaBlock, LocalBusinessSchema } from '@/components/sections';
import { contacts } from '@/lib/config';
import { getApprovedReviewQuotes, REVIEW_THEMES } from '@/lib/domain/content';
import { ratingLine, getRating } from '@/lib/domain/settings';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.otzyvy.title,
  description: PAGES.otzyvy.description,
  alternates: { canonical: '/otzyvy' },
};

export const dynamic = 'force-dynamic';

export default async function OtzyvyPage() {
  const rating = await getRating();
  const quotes = await getApprovedReviewQuotes();

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Отзывы' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Отзывы' }]} />

      <section className="section">
        <div className="container-page">
          <h1 className="text-3xl font-bold md:text-4xl">Отзывы</h1>
          <p className="mt-4 text-lg text-ink-soft">{ratingLine(rating)}</p>
          <a
            href={contacts.gisReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex font-semibold text-glass underline"
          >
            Читать все отзывы в 2ГИС
          </a>
          <p className="hint mt-3 max-w-2xl">
            Рейтинг и число оценок — данные карточки 2ГИС на {rating.checkedAt}. Мы показываем реальную оценку, включая
            критику, и отвечаем на отзывы в 2ГИС.
          </p>

          <h2 className="mt-10 text-2xl font-bold">Что отмечают клиенты</h2>
          <p className="mt-2 text-ink-soft">
            Ниже — обобщение тем из отзывов своими словами, а не цитаты. Мы не придумываем отзывы и не показываем
            «счётчики довольных клиентов».
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_THEMES.map((theme) => (
              <div key={theme.title} className="card">
                <p className="font-semibold">{theme.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{theme.text}</p>
              </div>
            ))}
          </div>

          {quotes.length > 0 ? (
            <>
              <h2 className="mt-10 text-2xl font-bold">Отзывы, которые можно цитировать</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {quotes.map((quote) => (
                  <li key={quote.id} className="card">
                    <p className="text-ink-soft">«{quote.text}»</p>
                    <p className="mt-3 text-sm font-semibold">{quote.author}</p>
                    {quote.sourceUrl ? (
                      <a
                        href={quote.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-glass underline"
                      >
                        Источник
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-8 card text-sm text-ink-soft">
              Дословные цитаты появятся здесь, когда владелец отметит их в админке и подтвердит согласие авторов. Пока
              их нет — читайте отзывы напрямую в 2ГИС.
            </p>
          )}
        </div>
      </section>

      <CtaBlock
        title="Остались вопросы после отзывов?"
        text="Напишите, что нужно, — ответим и посчитаем после замера."
        formKind="quick"
      />
    </>
  );
}
