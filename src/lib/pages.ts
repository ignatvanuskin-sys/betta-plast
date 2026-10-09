/**
 * Single source of truth for routes, metadata and navigation (§6).
 * Header, footer, sitemap and breadcrumbs all read from here, so a gated page
 * disappears everywhere at once.
 */
import { PAGE_GATING_CLAIMS } from './domain/claims-seed';

export type PageKey =
  | 'home'
  | 'okna'
  | 'balkony'
  | 'peregorodki'
  | 'remont-okon'
  | 'raschet'
  | 'zamer'
  | 'raboty'
  | 'otzyvy'
  | 'faq'
  | 'o-kompanii'
  | 'kontakty'
  | 'dlya-organizacij'
  | 'oplata-rassrochka'
  | 'politika';

export type PageDefinition = {
  key: PageKey;
  path: string;
  navLabel: string;
  /** Hidden from the header/footer menu (still reachable and in the sitemap). */
  footerOnly?: boolean;
  /** Google-style SERP title/description, city-qualified, unique per page. */
  title: string;
  description: string;
  /** Claim that must be confirmed before the page may be published (§6). */
  gatedBy?: string;
};

export const PAGES: Record<PageKey, PageDefinition> = {
  home: {
    key: 'home',
    path: '/',
    navLabel: 'Главная',
    title: 'Пластиковые окна и балконы под ключ в Караганде — Бетта Пласт',
    description:
      'Производство, замер, установка. Окна, остекление и отделка балконов и лоджий, перегородки, ремонт окон. Замер и расчёт стоимости — оставьте заявку.',
  },
  okna: {
    key: 'okna',
    path: '/okna',
    navLabel: 'Окна',
    title: 'Пластиковые окна в Караганде — изготовление и установка | Бетта Пласт',
    description:
      'Пластиковые окна для квартир и домов в Караганде: замер, изготовление, монтаж, откосы. Оставьте заявку — рассчитаем стоимость по вашим размерам.',
  },
  balkony: {
    key: 'balkony',
    path: '/balkony',
    navLabel: 'Балконы и лоджии',
    title: 'Остекление и отделка балконов и лоджий под ключ в Караганде | Бетта Пласт',
    description:
      'Остекление балконов и лоджий в Караганде: холодное и тёплое, утепление, отделка, откосы. Рассчитайте балкон по размерам и запишитесь на замер.',
  },
  peregorodki: {
    key: 'peregorodki',
    path: '/peregorodki',
    navLabel: 'Перегородки',
    title: 'Перегородки из ПВХ для бутиков и офисов в Караганде | Бетта Пласт',
    description:
      'Перегородки и витрины для бутиков, магазинов и офисов в Караганде. Эскиз по вашему размеру, изготовление и монтаж. Запросите расчёт.',
  },
  'remont-okon': {
    key: 'remont-okon',
    path: '/remont-okon',
    navLabel: 'Ремонт окон',
    title: 'Ремонт и регулировка пластиковых окон в Караганде | Бетта Пласт',
    description:
      'Не закрывается створка, дует, сломана ручка, «плачет» окно? Ремонт и регулировка окон и балконных дверей в Караганде. Оставьте заявку — приложите фото.',
  },
  raschet: {
    key: 'raschet',
    path: '/raschet',
    navLabel: 'Рассчитать стоимость',
    title: 'Рассчитать стоимость окон и балкона в Караганде | Бетта Пласт',
    description:
      'Ответьте на несколько вопросов о конструкции — мастер получит параметры и свяжется с вами. Расчёт стоимости окон, балконов и перегородок в Караганде.',
  },
  zamer: {
    key: 'zamer',
    path: '/zamer',
    navLabel: 'Запись на замер',
    title: 'Записаться на замер окон и балкона в Караганде | Бетта Пласт',
    description:
      'Выберите удобный день и время — мы подтвердим запись на замер. Замер окон, балконов и перегородок в Караганде.',
  },
  raboty: {
    key: 'raboty',
    path: '/raboty',
    navLabel: 'Наши работы',
    title: 'Наши работы — окна, балконы, перегородки в Караганде | Бетта Пласт',
    description: 'Фотографии выполненных работ: окна, балконы и лоджии, перегородки, ремонт. Караганда.',
  },
  otzyvy: {
    key: 'otzyvy',
    path: '/otzyvy',
    navLabel: 'Отзывы',
    title: 'Отзывы о Бетта Пласт — рейтинг в 2ГИС, Караганда',
    description:
      'Что отмечают клиенты: сроки, аккуратный монтаж, консультации и цена. Рейтинг компании в 2ГИС со ссылкой на источник.',
  },
  faq: {
    key: 'faq',
    path: '/faq',
    navLabel: 'Вопросы и ответы',
    title: 'Вопросы и ответы об окнах и балконах — Бетта Пласт, Караганда',
    description:
      'Сколько стоит окно или балкон, как проходит замер, какая гарантия, как работает рассрочка, работаете ли по договору — коротко и по делу.',
  },
  'o-kompanii': {
    key: 'o-kompanii',
    path: '/o-kompanii',
    navLabel: 'О компании',
    title: 'О компании Бетта Пласт — Караганда',
    description: 'Чем занимается Бетта Пласт, как мы работаем и что важно знать перед заказом окон и балконов в Караганде.',
  },
  kontakty: {
    key: 'kontakty',
    path: '/kontakty',
    navLabel: 'Контакты',
    title: 'Контакты — Бетта Пласт, Караганда, улица Складская, 8',
    description:
      'Адрес, телефон, WhatsApp, email и график работы. Как добраться: остановка «Сельхозтехника», парковка. Караганда, улица Складская, 8, офис 12.',
  },
  'dlya-organizacij': {
    key: 'dlya-organizacij',
    path: '/dlya-organizacij',
    navLabel: 'Для организаций',
    title: 'Окна и перегородки для организаций и опта — Бетта Пласт, Караганда',
    description:
      'Окна, перегородки и витрины для организаций: заявка с чертежом или спецификацией, работа по договору. Караганда.',
  },
  'oplata-rassrochka': {
    key: 'oplata-rassrochka',
    path: '/oplata-rassrochka',
    navLabel: 'Оплата и рассрочка',
    footerOnly: true,
    gatedBy: PAGE_GATING_CLAIMS.payment,
    title: 'Оплата, рассрочка и гарантия — Бетта Пласт, Караганда',
    description: 'Способы оплаты, условия рассрочки и гарантии при заказе окон и балконов в Караганде.',
  },
  politika: {
    key: 'politika',
    path: '/politika',
    navLabel: 'Политика конфиденциальности',
    footerOnly: true,
    title: 'Политика конфиденциальности — Бетта Пласт',
    description: 'Как мы обрабатываем и защищаем персональные данные, оставленные на сайте.',
  },
};

/** Pages that exist and are indexed, minus claim-gated ones. */
export function publishedPages(confirmed: Set<string>): PageDefinition[] {
  return Object.values(PAGES).filter((page) => !page.gatedBy || confirmed.has(page.gatedBy));
}

export function navPages(confirmed: Set<string>): PageDefinition[] {
  return publishedPages(confirmed).filter((page) => !page.footerOnly);
}

/**
 * Curated header navigation — six items on one line, like the reference.
 *
 * Everything else (13 routes in total) is reachable from the mobile sheet, the
 * footer and the in-page links. Putting the full list in the header made the
 * items wrap onto three lines and clip at 1440px.
 */
export const PRIMARY_NAV_KEYS: PageKey[] = ['okna', 'balkony', 'raboty', 'raschet', 'otzyvy', 'kontakty'];

/**
 * Terse labels for the header only — the long descriptive names stay in the
 * footer and the mobile sheet, where there is room for them.
 */
const SHORT_NAV_LABELS: Partial<Record<PageKey, string>> = {
  okna: 'Окна',
  balkony: 'Балконы',
  raboty: 'Работы',
  raschet: 'Расчёт',
  otzyvy: 'Отзывы',
  kontakty: 'Контакты',
};

export function primaryNavPages(confirmed: Set<string>): PageDefinition[] {
  const published = publishedPages(confirmed);
  return PRIMARY_NAV_KEYS.map((key) => published.find((page) => page.key === key))
    .filter((page): page is PageDefinition => Boolean(page))
    .map((page) => ({ ...page, navLabel: SHORT_NAV_LABELS[page.key] ?? page.navLabel }));
}
