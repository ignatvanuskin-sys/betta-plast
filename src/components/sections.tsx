import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ART_BY_KIND, type ArtKind } from './art';
import { IconCheck, IconClock, IconPhone, IconPin, IconStar, SERVICE_ICONS } from './icons';
import { TrackedLink } from './TrackedLink';
import { LeadForm } from './LeadForm';
import { company, contacts, defaultWorkingHours } from '@/lib/config';
import { HERO_PHOTO } from '@/lib/photos';
import { ratingLine, type RatingSetting } from '@/lib/domain/settings';

/* -------------------------------------------------------------------------- */
/* Section heading with the reference's eyebrow pattern                        */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  size = 'lg',
  align = 'left',
  onDark = false,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  size?: 'lg' | 'sm';
  align?: 'left' | 'center';
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      {eyebrow ? <span className={`eyebrow ${onDark ? 'eyebrow-on-dark' : ''}`}>{eyebrow}</span> : null}
      <h2 className={`mt-3 ${size === 'lg' ? 'display-2' : 'display-2-sm'} ${onDark ? 'text-primary-fg' : ''}`}>
        {title}
      </h2>
      {lead ? (
        <div className={`lead mt-4 ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'} ${onDark ? 'text-primary-fg/75' : ''}`}>
          {lead}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export function Hero({
  h1,
  eyebrow = 'Окна · балконы · перегородки · ремонт',
  subtitle,
  primary = { href: '/raschet', label: 'Запросить расчёт' },
  secondary,
  trust,
  compact = false,
}: {
  h1: string;
  eyebrow?: string;
  subtitle: string;
  primary?: { href: string; label: string };
  secondary?: ReactNode;
  trust?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-ink-deep text-white">
      {/* The reference fills this with a full-bleed photo. Until licensed
          photography exists, the same composition is drawn as an architectural
          elevation that bleeds off the right and bottom edges — deliberately
          reading as an illustration, never as a missing image. */}
      <HeroBackdrop />

      <div className={`container-page relative ${compact ? 'py-16 lg:py-24' : 'py-16 lg:py-28'}`}>
        <span className="inline-flex items-center rounded-full border border-white/30 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-gold-light">
          {eyebrow}
        </span>
        <h1 className="display-1 mt-6 max-w-3xl text-white">{h1}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 lg:text-lg">{subtitle}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={primary.href} className="btn btn-gold btn-sheen">
            {primary.label}
            <span aria-hidden="true" className="text-base leading-none">
              &#8599;
            </span>
          </Link>
          <TrackedLink
            href={contacts.telHref}
            event="call_click"
            props={{ place: 'hero' }}
            className="btn btn-outline"
            ariaLabel={`Позвонить ${contacts.phonePrimary}`}
          >
            <IconPhone size={16} />
            Позвонить
          </TrackedLink>
          {secondary}
        </div>

        {trust ? <div className="mt-9">{trust}</div> : null}
      </div>
    </section>
  );
}

/**
 * Hero backdrop: a licensed glass-facade photograph under a heavy dark-green
 * gradient. The gradient is what keeps the headline readable over a bright
 * photo, and it reproduces the reference's dark, moody hero.
 *
 * When no licensed photo is configured the drawn facade below is used instead,
 * so the hero never ends up as a flat empty panel.
 */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {HERO_PHOTO ? (
        <>
          <Image
            src={HERO_PHOTO.file}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,26,22,0.95)_0%,rgba(11,26,22,0.82)_46%,rgba(11,26,22,0.58)_100%)]" />
        </>
      ) : null}

      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary-hover/40 blur-3xl" />

      {HERO_PHOTO ? null : (
      <svg
        viewBox="0 0 900 620"
        preserveAspectRatio="xMaxYMid slice"
        className="absolute -right-[6%] -bottom-[8%] h-[108%] w-[86%] text-white/10 [mask-image:linear-gradient(to_right,transparent_0%,black_46%)] sm:w-[64%] lg:w-[52%]"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          {/* facade elevation: three bays, bleeding off the right edge */}
          <path d="M40 -20v680M300 -20v680M560 -20v680M820 -20v680" strokeWidth="2.4" />
          <path d="M-40 120h980M-40 320h980M-40 520h980" strokeWidth="2.4" />
          <path d="M40 120h260M300 120h260M560 120h260" opacity="0.55" />
          <path d="M40 320h260M300 320h260M560 320h260" opacity="0.55" />
          {/* glazing highlights */}
          <path d="M78 158h-38M338 158h-38M598 158h-38" strokeWidth="6" opacity="0.35" />
          <path d="M118 358h-78M378 358h-78M638 358h-78" strokeWidth="6" opacity="0.25" />
          {/* floor slabs */}
          <path d="M-40 116h980M-40 316h980M-40 516h980" strokeWidth="1" opacity="0.4" />
        </g>
      </svg>
      )}
    </div>
  );
}

/** Hero trust row: the 2GIS rating as sourced data plus existence-only facts. */
export function HeroTrust({ rating }: { rating: RatingSetting }) {
  const stats = [
    `${rating.value.toFixed(1).replace('.', ',')} в 2ГИС`,
    `${rating.reviewsCount} отзывов`,
    `${rating.ratingsCount} оценок`,
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex flex-wrap items-center gap-x-2 whitespace-nowrap text-[15px] font-medium text-white/90">
          {stats.map((stat, index) => (
            <span key={stat} className="flex items-center gap-2">
              {index > 0 ? <span className="text-white/35">·</span> : null}
              {stat}
            </span>
          ))}
        </p>
        <a
          href={contacts.gisReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap border-b border-white/45 pb-0.5 text-[15px] font-semibold text-white transition-colors hover:border-gold-light hover:text-gold-light"
        >
          Смотреть отзывы
        </a>
      </div>

      {/* Second row, exactly as in the reference: primary proof link + address. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
        <Link
          href="/raboty"
          className="whitespace-nowrap border-b border-white/45 pb-0.5 font-semibold text-white transition-colors hover:border-gold-light hover:text-gold-light"
        >
          Смотреть работы
        </Link>
        <span className="flex items-center gap-2 whitespace-nowrap text-white/70">
          <IconPin size={15} />
          {company.cityRu}, {company.addressRu}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust row (light sections)                                                 */
/* -------------------------------------------------------------------------- */

export function TrustRow({ rating }: { rating: RatingSetting }) {
  const items = [
    { icon: <IconStar size={16} />, text: ratingLine(rating), href: contacts.gisReviewsUrl },
    { icon: <IconCheck size={16} />, text: 'Рассрочка есть — условия у менеджера' },
    { icon: <IconCheck size={16} />, text: 'Гарантия есть — условия у менеджера' },
    { icon: <IconCheck size={16} />, text: 'Доставка' },
  ];

  return (
    <div className="border-b border-line bg-cream">
      <div className="container-page flex flex-wrap items-center gap-x-7 gap-y-3 py-4 text-sm text-ink-soft">
        {items.map((item) =>
          item.href ? (
            <a
              key={item.text}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 font-medium text-primary transition-colors hover:text-gold-deep"
            >
              <span className="text-gold">{item.icon}</span>
              {item.text}
            </a>
          ) : (
            <span key={item.text} className="inline-flex items-center gap-2.5">
              <span className="text-gold">{item.icon}</span>
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
  /** Short uppercase label above the title, e.g. «Окна и остекление». */
  badge?: string;
  /** Which drawn elevation to use as the card's image slot. */
  art?: ArtKind;
};

export function ServiceTiles({
  tiles,
  eyebrow,
  title = 'Что мы делаем',
  lead,
}: {
  tiles: ServiceTile[];
  eyebrow?: string;
  title?: string;
  lead?: ReactNode;
}) {
  return (
    <section className="section bg-sand">
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiles.map((tile, index) => {
            const Icon = SERVICE_ICONS[tile.icon];
            const Art = ART_BY_KIND[tile.art ?? 'window'];
            return (
              <Link
                key={tile.href}
                href={tile.href}
                data-reveal
                data-reveal-delay={index * 70}
                className="card group flex flex-col overflow-hidden !p-0 transition-colors hover:border-primary/35"
              >
                <span className="block bg-primary-soft px-4 pt-4 text-primary">
                  <Art className="h-[150px] w-full" />
                </span>
                <span className="flex flex-1 flex-col p-5">
                <span className="inline-flex items-center gap-2 text-primary">
                  <Icon size={18} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-deep">
                    {tile.badge}
                  </span>
                </span>
                <h3 className="card-title mt-3">{tile.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{tile.text}</p>
                <span className="mt-4 text-sm font-medium text-gold-deep">
                  Подробнее
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Audience cards («Подбор по задаче»)                                        */
/* -------------------------------------------------------------------------- */

export type AudienceCard = {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
};

export function AudienceCards({ cards }: { cards: AudienceCard[] }) {
  return (
    <section className="section bg-cream" id="podbor">
      <div className="container-page">
        <SectionHeading
          eyebrow="Подбор по задаче"
          title="Не каталог ради каталога — решение под ваш объект"
          lead="Выберите, что ближе к вашему случаю. Если не уверены — опишите задачу, подскажем направление."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <Link
              key={card.title}
              href={card.href}
              data-reveal
              data-reveal-delay={index * 70}
              className="card group flex flex-col transition-colors hover:border-primary/35"
            >
              <span className="eyebrow">{card.eyebrow}</span>
              <h3 className="mt-3 text-xl font-semibold leading-snug">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{card.text}</p>
              <span className="mt-4 text-sm font-medium text-gold-deep">
                {card.cta}
                <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
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
    <section className="section bg-deeper">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Балконы и лоджии"
            title="Балкон или лоджия под ключ"
            lead="Самый частый заказ: сначала окна, потом балкон. Расскажите про свой балкон — подскажем, что реально нужно, и посчитаем после замера."
          />
          <div className="mt-8">
            <Link href="/raschet?kind=balcony" className="btn btn-green btn-sheen">
              Рассчитать балкон
            </Link>
          </div>
        </div>
        <div className="rounded-[0.9rem] border border-line bg-cream p-6 lg:p-8">
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                <IconCheck size={17} className="mt-0.5 shrink-0 text-gold" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
            Измерять самому не нужно: достаточно примерных размеров и фото. Точные цифры снимет замерщик — и только после
            этого называется стоимость.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps / Why us                                                             */
/* -------------------------------------------------------------------------- */

export function Steps({ steps, eyebrow = 'Как проходит запрос', title = 'Короткий путь от идеи до точного разговора' }: {
  steps: Array<{ title: string; text: string }>;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section className="section bg-sand" id="how">
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="card"
              data-reveal
              data-reveal-delay={index * 70}
            >
              <span className="text-sm font-semibold tracking-[0.18em] text-gold">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="card-title mt-3">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyUs({ items, eyebrow = 'Почему мы', title = 'Почему выбирают нас' }: {
  items: Array<{ title: string; text: string }>;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section className="section bg-sand">
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <div key={item.title} className="card" data-reveal data-reveal-delay={index * 70}>
              <IconCheck size={20} className="text-gold" />
              <h3 className="card-title mt-3">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
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

export function FaqBlock({
  items,
  eyebrow = 'FAQ',
  title = 'Ответы до разговора с менеджером',
}: {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section className="section bg-sand" id="faq">
      <div className="container-page">
        <div className="mx-auto max-w-[900px]">
          <SectionHeading eyebrow={eyebrow} title={title} align="center" />
          <div className="mt-10 divide-y divide-line card-plain">
            {items.map((item) => (
              <details key={item.question} className="group px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left">
                  <span className="font-semibold leading-snug text-primary">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-gold-deep transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="pb-6">
                  <p className="text-[15px] leading-relaxed text-ink-soft">{item.answer}</p>
                  {item.needsManager ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <TrackedLink
                        href={contacts.waHref}
                        event="whatsapp_click"
                        props={{ place: 'faq' }}
                        className="btn btn-outline !min-h-11 !text-[13px]"
                      >
                        Спросить в WhatsApp
                      </TrackedLink>
                      <TrackedLink
                        href={contacts.telHref}
                        event="call_click"
                        props={{ place: 'faq' }}
                        className="btn btn-outline !min-h-11 !text-[13px]"
                      >
                        Позвонить
                      </TrackedLink>
                    </div>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CTA blocks                                                                 */
/* -------------------------------------------------------------------------- */

export function CtaBlock({
  title,
  text,
  formKind,
  kind,
  segment,
  id = 'zayavka',
  eyebrow = 'Последний шаг',
  extra,
}: {
  title: string;
  text: string;
  formKind: string;
  kind?: string;
  segment?: 'b2c' | 'b2b';
  id?: string;
  eyebrow?: string;
  extra?: ReactNode;
}) {
  return (
    <section className="section bg-bg" id={id}>
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow={eyebrow} title={title} lead={text} />
          {extra}
          <ul className="mt-8 space-y-3.5 text-sm leading-relaxed text-ink-soft">
            <li className="flex items-start gap-3">
              <IconClock size={17} className="mt-0.5 shrink-0 text-gold" />
              Отвечаем в рабочее время. Полный график уточняйте у менеджера — и в WhatsApp тоже.
            </li>
            <li className="flex items-start gap-3">
              <IconPin size={17} className="mt-0.5 shrink-0 text-gold" />
              {company.addressRu}, {company.districtRu}
            </li>
            <li className="flex items-start gap-3">
              <IconCheck size={17} className="mt-0.5 shrink-0 text-gold" />
              Стоимость называем после замера — без «сюрпризов» в договоре.
            </li>
          </ul>
        </div>
        <div className="card-plain p-6 lg:p-8">
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
    <nav aria-label="Хлебные крошки" className="border-b border-line bg-bg">
      <div className="container-page">
        <ol className="flex flex-wrap items-center gap-2 py-3.5 text-[13px] text-muted-fg">
          {trail.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className="text-primary">{item.label}</span>
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
  const mapHref = contacts.gisFirmUrl;

  const rows = [
    {
      label: 'Телефон',
      value: contacts.phonePrimary,
      href: contacts.telHref,
      event: 'call_click',
      note: 'Какой номер основной — уточните у менеджера',
    },
    { label: 'WhatsApp', value: `+${contacts.whatsapp}`, href: contacts.waHref, event: 'whatsapp_click' },
    { label: 'Email', value: contacts.email, href: `mailto:${contacts.email}`, event: 'email_click' },
  ];

  return (
    <section className="section bg-bg" id="contacts">
      <div className="container-page">
        <SectionHeading
          eyebrow="Контакты"
          title="Можно начать с удобного канала"
          lead="Адрес и телефон подтверждены открытой карточкой 2ГИС."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="grid gap-3">
            {rows.map((row) => (
              <TrackedLink
                key={row.label}
                href={row.href}
                event={row.event}
                props={{ place: 'contacts' }}
                className="flex items-center justify-between rounded-2xl border border-line bg-cream px-5 py-4 transition-colors hover:border-primary/35"
              >
                <span className="text-sm text-muted-fg">{row.label}</span>
                <span className="text-[15px] font-semibold text-primary">{row.value}</span>
              </TrackedLink>
            ))}

            <div className="rounded-2xl border border-line bg-cream px-5 py-4">
              <p className="text-sm text-muted-fg">График работы</p>
              <p className="mt-1 text-[15px] font-semibold text-primary">
                {friday ? `Пятница ${String(Math.floor(friday.startMinute / 60)).padStart(2, '0')}:00–${String(Math.floor(friday.endMinute / 60)).padStart(2, '0')}:00` : 'Пятница 09:00–18:00'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-fg">
                Полный график по дням недели уточняйте у менеджера
              </p>
            </div>
          </div>

          <div className="on-dark flex flex-col justify-between rounded-2xl bg-primary p-6 text-primary-fg lg:p-8">
            <div>
              <span className="eyebrow eyebrow-on-dark">Адрес</span>
              <p className="mt-3 text-xl font-semibold leading-snug">{company.addressRu}</p>
              <p className="mt-2 text-sm leading-relaxed text-primary-fg/75">
                {company.districtRu}. {company.transitRu}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink href={mapHref} event="map_click" props={{ place: 'contacts' }} className="btn btn-gold btn-sheen">
                Открыть в 2ГИС
              </TrackedLink>
              <Link href="/zamer" className="btn btn-outline">
                Записаться на замер
              </Link>
            </div>
          </div>
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
