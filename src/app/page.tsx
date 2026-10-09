import Link from 'next/link';
import type { Metadata } from 'next';

import { GalleryGrid } from '@/components/Gallery';
import {
  AudienceCards,
  BalconyHighlight,
  ContactBlock,
  FaqBlock,
  FaqSchema,
  Hero,
  HeroTrust,
  LocalBusinessSchema,
  SectionHeading,
  ServiceTiles,
  Steps,
  WhyUs,
} from '@/components/sections';
import { ART_BY_KIND } from '@/components/art';
import { FAQ_ITEMS } from '@/lib/content/faq';
import { getGallery, REVIEW_THEMES } from '@/lib/domain/content';
import { getRating, ratingLine } from '@/lib/domain/settings';
import { contacts } from '@/lib/config';
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
    title: 'Окна по размеру',
    text: 'Пластиковые окна для квартир и частных домов: замер, изготовление, монтаж, откосы.',
    icon: 'window' as const,
    badge: 'Квартиры и дома',
    art: 'window' as const,
  },
  {
    href: '/balkony',
    title: 'Балконы и лоджии',
    text: 'Остекление, утепление, обшивка, откосы и встроенный шкаф — под ключ.',
    icon: 'balcony' as const,
    badge: 'Самый частый заказ',
    art: 'balcony' as const,
  },
  {
    href: '/peregorodki',
    title: 'Перегородки и витрины',
    text: 'Для бутиков, магазинов и офисов. Эскиз по вашему размеру и монтаж.',
    icon: 'partition' as const,
    badge: 'Коммерческие объекты',
    art: 'partition' as const,
  },
];

/** Extra illustrated tiles that give the page visual weight without photos. */
const CONSTRUCTIONS = [
  { kind: 'window' as const, title: 'Окна', text: 'Глухие, поворотные, поворотно-откидные. Любые размеры проёма.' },
  { kind: 'balcony' as const, title: 'Балконы и лоджии', text: 'Остекление в пол, вынос по ширине, откосы и отливы.' },
  { kind: 'partition' as const, title: 'Перегородки', text: 'Стекло, матовые вставки, двери и доборы под потолок.' },
  { kind: 'repair' as const, title: 'Ремонт и регулировка', text: 'Провисшие створки, продувание, замена уплотнителя и фурнитуры.' },
];

const AUDIENCE = [
  {
    eyebrow: 'Жилые помещения',
    title: 'Для квартиры',
    text: 'Замена окон, отдельные створки, балкон, регулировка и ремонт.',
    href: '/okna',
    cta: 'Рассчитать окна',
  },
  {
    eyebrow: 'Индивидуальный проект',
    title: 'Для дома',
    text: 'Остекление и конструкции по вашим размерам — от одной створки до всего дома.',
    href: '/raschet',
    cta: 'Обсудить дом',
  },
  {
    eyebrow: 'Коммерческие объекты',
    title: 'Для бизнеса',
    text: 'Перегородки, витрины и окна для магазинов, бутиков и офисов. Работа по договору.',
    href: '/dlya-organizacij',
    cta: 'Запросить расчёт',
  },
  {
    eyebrow: 'Без лишних вопросов',
    title: 'Нужен совет',
    text: 'Не знаете, что выбрать? Опишите задачу — подскажем направление.',
    href: '/faq',
    cta: 'Задать вопрос',
  },
];

const PRICE_FACTORS = [
  'Размер проёма, количество створок и тип открывания',
  'Стеклопакет: число камер и энергосбережение',
  'Фурнитура, откосы, подоконник и отливы',
  'Объём монтажа, этаж и доставка',
];

const MATERIALS = [
  {
    title: 'Для квартиры и дома',
    text: 'Тёплые конструкции для жилых помещений: держат тепло и уличный шум, подходят для стандартных и нестандартных проёмов.',
  },
  {
    title: 'Для коммерческих объектов',
    text: 'Тонкие прочные рамы и большие площади остекления: витрины, входные группы, перегородки, панорамные конструкции.',
  },
];

const REQUEST_STEPS = [
  { title: 'Опишите задачу', text: 'Выберите, что нужно: окна, балкон, перегородка или ремонт.' },
  { title: 'Добавьте контекст', text: 'Укажите адрес, примерные размеры и, если удобно, приложите фото объекта.' },
  { title: 'Получите связь', text: 'Менеджер уточнит параметры и согласует следующий шаг — замер или расчёт.' },
];

const WHY_US = [
  { title: 'Замер до расчёта', text: 'Цифры считаем по фактическому проёму, а не по прикидкам.' },
  { title: 'Рейтинг в 2ГИС', text: 'Клиенты отмечают сроки, аккуратный монтаж и консультации.' },
  { title: 'Ремонт и регулировка', text: 'Если окно уже стоит — отремонтируем и отрегулируем.' },
  { title: 'Организациям', text: 'Окна и перегородки, оплата через банк, оформление — у менеджера.' },
];

export default async function HomePage() {
  const rating = await getRating();
  const gallery = await getGallery({ onlyHome: true, limit: 8 });

  return (
    <>
      <LocalBusinessSchema />
      <FaqSchema items={FAQ_ITEMS.slice(0, 6)} />

      <Hero
        h1="Свет, тепло и тишина — в вашем доме."
        subtitle="Окна, остекление балконов и перегородки в Караганде. Подберём решение под ваш объект, организуем замер и подготовим расчёт."
        primary={{ href: '/raschet', label: 'Запросить расчёт' }}
        trust={<HeroTrust rating={rating} />}
      />

      <ServiceTiles
        tiles={SERVICES}
        eyebrow="Направления"
        title="Три направления, с которых чаще всего начинают"
        lead="Опишите объект — подскажем решение и посчитаем после замера."
      />

      {/* Illustrated grid — carries the visual weight the reference gets from
          photography, drawn rather than borrowed. */}
      <section className="section-sm bg-cream" id="konstrukcii">
        <div className="container-page">
          <SectionHeading
            eyebrow="Что можно заказать"
            title="Конструкции под ваш размер"
            size="sm"
            lead="Покажем схему и обсудим детали на замере. Точные размеры снимаются по месту."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CONSTRUCTIONS.map((item, index) => {
              const Art = ART_BY_KIND[item.kind];
              return (
                <div
                  key={item.title}
                  className="card overflow-hidden !p-0"
                  data-reveal
                  data-reveal-delay={index * 70}
                >
                  <span className="block bg-primary-soft px-3 pt-3 text-primary">
                    <Art className="h-[110px] w-full sm:h-[150px]" title={item.title} />
                  </span>
                  <span className="block p-4">
                    <span className="block font-semibold leading-snug text-primary">{item.title}</span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-soft">{item.text}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AudienceCards cards={AUDIENCE} />

      {gallery.length > 0 ? (
        <section className="section-sm bg-sand" id="works">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Наши работы"
                title="Реальные объекты, а не стоковые картинки"
                size="sm"
                lead="Фотографии наших объектов: окна, балконы, перегородки. Нажмите на снимок, чтобы рассмотреть детали."
              />
              <Link href="/raboty" className="btn btn-outline shrink-0">
                Все работы
              </Link>
            </div>
            <div className="mt-10">
              <GalleryGrid items={gallery} />
            </div>
          </div>
        </section>
      ) : null}

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

      {/* Reference places its live calculator here. Betta Plast has no confirmed
          price list yet, so this block collects the configuration instead of
          showing a number (PRICE_DISPLAY=off). */}
      <section className="section on-dark bg-dark" id="calculator">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Предварительный расчёт"
              title="Соберите конфигурацию за минуту"
              onDark
              lead="Выберите тип конструкции и параметры — менеджер получит вашу конфигурацию вместе с заявкой и подготовит расчёт по реальным размерам и монтажу."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/raschet" className="btn btn-gold btn-sheen">
                Пройти мастер расчёта
              </Link>
              <a
                href={contacts.waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Расчёт в WhatsApp
              </a>
            </div>
          </div>
          <div className="rounded-[0.9rem] border border-white/15 bg-white/5 p-6 lg:p-8">
            <p className="text-sm font-medium text-primary-fg">Что уточнит мастер</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Тип конструкции', 'Размеры проёма', 'Тип открывания', 'Дополнительно: откосы, сетки, шкаф'].map(
                (item) => (
                  <li key={item} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-primary-fg/85">
                    {item}
                  </li>
                ),
              )}
            </ul>
            <p className="mt-5 text-[13px] leading-relaxed text-primary-fg/60">
              Стоимость называем после замера: она зависит от размеров, стеклопакета, фурнитуры и объёма монтажа.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-warm" id="price">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Про цену честно"
              title="Мы не пишем «окно от 30 000 ₸». И вот почему."
              lead="Одинаковые на вид окна отличаются в цене в разы — и почти всегда разница не в самом окне, а в комплектации и монтаже. Поэтому вместо усреднённой цифры мы считаем по вашим параметрам и объясняем, из чего складывается сумма."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/raschet" className="btn btn-green btn-sheen">
                Рассчитать стоимость
              </Link>
              <a href={contacts.waHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Расчёт в WhatsApp
              </a>
            </div>
          </div>
          <div>
            <ul className="grid gap-3">
              {PRICE_FACTORS.map((factor) => (
                <li key={factor} className="rounded-xl border border-line bg-cream px-5 py-4 text-sm leading-relaxed text-ink-soft">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section bg-cream">
        <div className="container-page">
          <SectionHeading
            eyebrow="Что выбрать"
            title="Что подойдёт именно вашему объекту"
            lead="Не уверены в варианте? Опишите объект — подскажем и объясним разницу на вашем примере, без навязывания более дорогого решения."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {MATERIALS.map((item, index) => (
              <div key={item.title} className="card" data-reveal data-reveal-delay={index * 70}>
                <h3 className="display-3">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Steps steps={REQUEST_STEPS} />
      <WhyUs items={WHY_US} />

      <section className="section-sm bg-deeper" id="reviews">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Отзывы"
              title="Что говорят клиенты"
              size="sm"
              lead={`
                ${ratingLine(rating)}. Это данные карточки 2ГИС на ${rating.checkedAt} — мы не придумываем отзывы и не
                показываем «счётчики довольных клиентов».
              `}
            />
            <a
              href={contacts.gisReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline shrink-0"
            >
              Читать в 2ГИС
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_THEMES.map((theme, index) => (
              <div key={theme.title} className="card" data-reveal data-reveal-delay={index * 70}>
                <p className="font-semibold leading-snug text-primary">{theme.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{theme.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-muted-fg">
            Это обобщение тем из отзывов, а не цитаты: дословные отзывы появятся на сайте только с согласия авторов и
            после подтверждения владельцем. Пока читайте их напрямую в 2ГИС.
          </p>
        </div>
      </section>

      <section className="section bg-sand">
        <div className="container-page">
          <div className="on-dark rounded-[0.9rem] bg-dark px-6 py-10 text-center lg:px-16 lg:py-14">
            <span className="eyebrow eyebrow-on-dark">Последний шаг</span>
            <h2 className="display-2 mt-3 text-primary-fg">Рассчитаем стоимость вашего проекта</h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-fg/75">
              Опишите объект — подберём конструкцию, назовём сроки и подготовим расчёт. Консультация ни к чему не
              обязывает.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/raschet" className="btn btn-gold btn-sheen">
                Получить расчёт
              </Link>
              <a href={contacts.waHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                WhatsApp
              </a>
              <a href={contacts.telHref} className="btn btn-outline">
                Позвонить
              </a>
            </div>
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ_ITEMS.slice(0, 6)} />
      <ContactBlock />
    </>
  );
}
