import Link from 'next/link';
import type { ReactNode } from 'react';

import { IconCheck, IconClock, IconPin, IconStar, SERVICE_ICONS } from './icons';
import { TrackedLink } from './TrackedLink';
import { LeadForm } from './LeadForm';
import { company, contacts, defaultWorkingHours } from '@/lib/config';
import { ratingLine, type RatingSetting } from '@/lib/domain/settings';

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export function Hero({
  h1,
  subtitle,
  primary = { href: '/raschet', label: 'Рассчитать стоимость' },
  compact = false,
}: {
  h1: string;
  subtitle: string;
  primary?: { href: string; label: string };
  compact?: boolean;
}) {
  return (
    <section className="border-b border-line bg-surface">
      <div className={`container-page grid gap-8 ${compact ? 'py-10' : 'py-12 md:py-20'} lg:grid-cols-[1.1fr_0.9fr]`}>
        <div className="flex flex-col justify-center">
          <h1 className={`font-bold ${compact ? 'text-3xl md:text-4xl' : 'text-3xl md:text-5xl'}`}>{h1}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={primary.href} className="btn btn-cta">
              {primary.label}
            </Link>
            <TrackedLink href={contacts.waHref} event="whatsapp_click" props={{ place: 'hero' }} className="btn btn-wa">
              Написать в WhatsApp
            </TrackedLink>
            <TrackedLink
              href={contacts.telHref}
              event="call_click"
              props={{ place: 'hero' }}
              className="btn btn-outline"
              ariaLabel={`Позвонить ${contacts.phonePrimary}`}
            >
              Позвонить {contacts.phonePrimary}
            </TrackedLink>
          </div>
        </div>

        {/* Clean window-frame geometry instead of a stock photo (§10). */}
        <div className="relative hidden items-center justify-center lg:flex" aria-hidden="true">
          <div className="sash relative h-64 w-72 rounded-lg border-2 border-line bg-glass-soft">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-line" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-line" />
            <div className="absolute inset-6 rounded border border-white/60 bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Rating and existence facts — never terms that the owner has not confirmed. */
export function TrustRow({ rating }: { rating: RatingSetting }) {
  const items = [
    { icon: <IconStar size={18} />, text: ratingLine(rating), href: contacts.gisReviewsUrl },
    { icon: <IconCheck size={18} />, text: 'Рассрочка есть — условия у менеджера' },
    { icon: <IconCheck size={18} />, text: 'Гарантия есть — условия у менеджера' },
    { icon: <IconCheck size={18} />, text: 'Доставка' },
  ];

  return (
    <div className="border-b border-line bg-bg">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-sm text-ink-soft">
        {items.map((item) =>
          item.href ? (
            <a
              key={item.text}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-ink hover:text-glass"
            >
              <span className="text-glass">{item.icon}</span>
              {item.text}
            </a>
          ) : (
            <span key={item.text} className="inline-flex items-center gap-2">
              <span className="text-glass">{item.icon}</span>
              {item.text}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Service tiles                                                              */
/* -------------------------------------------------------------------------- */

export type ServiceTile = {
  href: string;
  title: string;
  text: string;
  icon: keyof typeof SERVICE_ICONS;
};

export function ServiceTiles({ tiles, title = 'Что мы делаем' }: { tiles: ServiceTile[]; title?: string }) {
  return (
    <section className="section">
      <div className="container-page">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = SERVICE_ICONS[tile.icon];
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="card transition hover:border-glass hover:shadow-sm"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-glass-soft text-glass">
                  <Icon size={22} />
                </span>
                <h3 className="mt-3 text-lg font-semibold">{tile.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{tile.text}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Balcony highlight                                                          */
/* -------------------------------------------------------------------------- */

export function BalconyHighlight({ items }: { items: string[] }) {
  return (
    <section className="section bg-graphite text-white">
      <div className="container-page grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Балкон или лоджия под ключ</h2>
          <p className="mt-3 text-white/80">
            Самый частый заказ: сначала окна, потом балкон. Расскажите про свой балкон — подскажем, что реально нужно,
            и посчитаем после замера.
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-white/90">
                <IconCheck size={18} className="mt-0.5 shrink-0 text-white" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link href="/raschet?kind=balcony" className="btn btn-cta">
              Рассчитать балкон
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-white/15 p-6">
          <p className="font-semibold">Как измерять самому — не нужно</p>
          <p className="mt-2 text-sm text-white/75">
            Достаточно примерных размеров и фото. Точные цифры снимет замерщик, и только после этого называется
            стоимость. Так вы не платите за лишнее.
          </p>
          <p className="mt-4 text-sm text-white/75">
            Встроенный шкаф или стеллаж, откосы и обшивка — обсуждаем на месте: не всё нужно в каждом балконе.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps / Why us                                                             */
/* -------------------------------------------------------------------------- */

export function Steps({ steps }: { steps: Array<{ title: string; text: string }> }) {
  return (
    <section className="section">
      <div className="container-page">
        <h2 className="text-2xl font-bold md:text-3xl">Как мы работаем</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title} className="card">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-glass text-sm font-bold text-glass">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyUs({ items }: { items: Array<{ title: string; text: string }> }) {
  return (
    <section className="section bg-surface-2">
      <div className="container-page">
        <h2 className="text-2xl font-bold md:text-3xl">Почему выбирают нас</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="card">
              <IconCheck size={22} className="text-glass" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type FaqItem = { question: string; answer: string; needsManager?: boolean };

export function FaqBlock({ items, title = 'Вопросы и ответы' }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((item) => (
            <details key={item.question} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.question}
                <span className="text-glass transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink-soft">{item.answer}</p>
              {item.needsManager ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <TrackedLink
                    href={contacts.waHref}
                    event="whatsapp_click"
                    props={{ place: 'faq' }}
                    className="btn btn-outline py-2 text-sm"
                  >
                    Спросить в WhatsApp
                  </TrackedLink>
                  <TrackedLink href={contacts.telHref} event="call_click" props={{ place: 'faq' }} className="btn btn-outline py-2 text-sm">
                    Позвонить
                  </TrackedLink>
                </div>
              ) : null}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CTA block with a form                                                      */
/* -------------------------------------------------------------------------- */

export function CtaBlock({
  title,
  text,
  formKind,
  kind,
  segment,
  id = 'zayavka',
  extra,
}: {
  title: string;
  text: string;
  formKind: string;
  kind?: string;
  segment?: 'b2c' | 'b2b';
  id?: string;
  extra?: ReactNode;
}) {
  return (
    <section className="section bg-surface" id={id}>
      <div className="container-page grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="mt-3 text-ink-soft">{text}</p>
          {extra}
          <ul className="mt-6 space-y-3 text-sm text-ink-soft">
            <li className="flex items-start gap-2">
              <IconClock size={18} className="mt-0.5 shrink-0 text-glass" />
              Отвечаем в рабочее время. Полный график уточняйте у менеджера — и в WhatsApp тоже.
            </li>
            <li className="flex items-start gap-2">
              <IconPin size={18} className="mt-0.5 shrink-0 text-glass" />
              {company.addressRu}, {company.districtRu}
            </li>
            <li className="flex items-start gap-2">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-glass" />
              Стоимость называем после замера — без «сюрпризов» в договоре.
            </li>
          </ul>
        </div>
        <div className="card">
          <LeadForm formKind={formKind} defaultKind={kind} segment={segment} showKindSelect={!kind} />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Breadcrumbs                                                               */
/* -------------------------------------------------------------------------- */

export function Breadcrumbs({ trail }: { trail: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Хлебные крошки" className="border-b border-line bg-surface">
      <div className="container-page">
        <ol className="flex flex-wrap items-center gap-2 py-3 text-sm text-muted">
          {trail.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href ? (
                <Link href={item.href} className="hover:text-glass">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

export function ContactBlock() {
  const friday = defaultWorkingHours.schedule.find((entry) => entry.weekday === 5);
  const mapSrc = `https://2gis.kz/karaganda/firm/11822477302933245`;

  return (
    <section className="section" id="kontakty">
      <div className="container-page grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Контакты и как добраться</h2>
          <dl className="mt-6 space-y-4 text-ink-soft">
            <div>
              <dt className="font-semibold text-ink">Адрес</dt>
              <dd>
                {company.addressRu}
                <br />
                {company.districtRu}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Телефон и WhatsApp</dt>
              <dd>
                <TrackedLink href={contacts.telHref} event="call_click" props={{ place: 'contacts' }} className="font-medium text-ink">
                  {contacts.phonePrimary}
                </TrackedLink>
                {' · '}
                <TrackedLink href={contacts.waHref} event="whatsapp_click" props={{ place: 'contacts' }} className="font-medium text-ink">
                  WhatsApp
                </TrackedLink>
                <br />
                <span className="hint">Какой номер основной — уточните у менеджера.</span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd>
                <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">График</dt>
              <dd>
                {friday ? <>Пятница: 09:00–18:00, обед 13:00–14:00.</> : null} Полный график по дням недели уточняйте у
                менеджера.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Транспорт и парковка</dt>
              <dd>{company.transitRu}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedLink
              href={mapSrc}
              event="map_click"
              props={{ place: 'contacts' }}
              className="btn btn-outline"
            >
              Открыть в 2ГИС
            </TrackedLink>
          </div>
        </div>
        <div className="card p-0">
          <TrackedLink
            href={mapSrc}
            event="map_click"
            props={{ place: 'contacts_map' }}
            className="block h-72 overflow-hidden rounded-xl bg-glass-soft"
          >
            {/* A static frame keeps the page fast; the map itself opens in 2GIS. */}
            <span className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <IconPin size={32} className="text-glass" />
              <span className="font-semibold">{company.addressRu}</span>
              <span className="text-sm text-ink-soft">{company.districtRu}</span>
              <span className="text-sm text-glass underline">Открыть карту в 2ГИС</span>
            </span>
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Structured data (§13)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * JSON-LD for the company. Only confirmed facts are emitted, and the 2GIS
 * rating is deliberately NOT marked up as our own aggregateRating (§5.4).
 */
export function LocalBusinessSchema({ areaServed = 'Караганда' }: { areaServed?: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: company.nameRu,
    description: company.taglineRu,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'улица Складская, 8, офис 12',
      addressLocality: 'Караганда',
      addressCountry: 'KZ',
    },
    geo: { '@type': 'GeoCoordinates', latitude: company.lat, longitude: company.lon },
    telephone: contacts.phonePrimary,
    email: contacts.email,
    url: process.env.SITE_URL ?? undefined,
    areaServed,
    sameAs: [contacts.instagramUrl, contacts.gisFirmUrl],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FaqSchema({ items }: { items: FaqItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BreadcrumbSchema({ trail }: { trail: Array<{ href?: string; label: string }> }) {
  const base = process.env.SITE_URL ?? '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${base}${item.href}` : undefined,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
