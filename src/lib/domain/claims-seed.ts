/**
 * Starter claims registry — Приложение A мастер-промпта.
 *
 * `confirmed` rows are the only facts taken from a verifiable source (the 2GIS
 * company card, checked 09.10.2026). Everything else stays `unconfirmed` until
 * the owner answers, and is therefore never rendered in the public UI.
 *
 * For `installment` and `warranty` only the *existence* is confirmed by the
 * company itself in its 2GIS card, so the published wording deliberately says
 * nothing about terms — matching the example given in §5.1.
 */
export type ClaimSeed = {
  key: string;
  textRu: string;
  status: 'confirmed' | 'unconfirmed';
  source: '2gis' | 'owner' | 'reviews' | 'none';
  questionRu: string;
  note: string;
};

export const CLAIM_KEYS = [
  'company_contacts',
  'rating_2gis',
  'production',
  'services_core',
  'balcony_services',
  'delivery',
  'payment_methods',
  'installment',
  'warranty',
  'contract_act',
  'working_hours_week',
  'free_measure',
  'measure_speed',
  'service_area',
  'lead_time_production',
  'lead_time_install',
  'brands',
  'price_samples',
  'founded_year',
  'legal_entity',
  'workshop',
  'team_names',
  'b2b_terms',
  'brand_assets',
  'review_quotes_consent',
  'main_whatsapp',
  'kk_version',
  // Keys added on top of Приложение A: they gate pages/terms that must not be
  // published on the strength of the 2GIS card alone (§6).
  'installment_terms',
  'warranty_terms',
  'doors',
] as const;

export type ClaimKey = (typeof CLAIM_KEYS)[number];

export const CLAIM_SEED: ClaimSeed[] = [
  {
    key: 'company_contacts',
    textRu:
      'Бетта Пласт — производственно-торговая компания. Караганда, улица Складская, 8, офис 12, 1 этаж (район Казыбек Би).',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Проверьте название, адрес, телефон и email — всё ли верно?',
    note: 'Источник: карточка компании в 2ГИС, проверено 09.10.2026.',
  },
  {
    key: 'rating_2gis',
    textRu: 'Рейтинг в 2ГИС: 4,8 · 62 оценки (по данным карточки на 09.10.2026)',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Обновлять рейтинг и число оценок раз в месяц — оставляем как есть?',
    note: 'Показывается как данные 2ГИС со ссылкой на источник. Не размечается как собственный aggregateRating.',
  },
  {
    key: 'production',
    textRu: '',
    status: 'unconfirmed',
    source: '2gis',
    questionRu: 'У вас собственное производство? Можно ли писать «собственное производство»?',
    note: 'В 2ГИС тип предприятия указан как «Производство». Формулировку нужно подтвердить.',
  },
  {
    key: 'services_core',
    textRu: 'Пластиковые окна; остекление и отделка балконов; перегородки; ремонт окон',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Список основных услуг полный?',
    note: 'Источник: рубрики карточки 2ГИС.',
  },
  {
    key: 'balcony_services',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'Что входит в «балкон под ключ»: остекление, утепление, обшивка, откосы, шкаф?',
    note: 'Темы из отзывов клиентов 2ГИС. До подтверждения владельцем на сайте нет перечня «под ключ».',
  },
  {
    key: 'delivery',
    textRu: 'Доставка',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Доставка: по каким районам, платная ли?',
    note: 'Существование услуги подтверждено карточкой 2ГИС; условия — нет.',
  },
  {
    key: 'payment_methods',
    textRu: 'Наличный расчёт, оплата через банк, оплата по QR-коду',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Способы оплаты актуальны? Добавить что-то?',
    note: 'Источник: карточка 2ГИС.',
  },
  {
    key: 'installment',
    textRu: 'Рассрочка есть — условия уточняйте у менеджера',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Рассрочка: срок, первый взнос, через банк или своя, требования к клиенту?',
    note: 'В карточке 2ГИС компания сама указывает рассрочку — подтверждено только существование. Условия публиковать нельзя до ответа владельца.',
  },
  {
    key: 'installment_terms',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Можно ли публиковать условия рассрочки (срок, взнос, банк) и страницу «Оплата и рассрочка»?',
    note: 'Пока не подтверждено, страница /oplata-rassrochka не создаётся и не попадает в меню и sitemap (§6).',
  },
  {
    key: 'warranty',
    textRu: 'Гарантия есть — условия уточняйте у менеджера',
    status: 'confirmed',
    source: '2gis',
    questionRu: 'Гарантия на конструкции и монтаж: срок и условия? (клиенты упоминают «год гарантии»)',
    note: 'В карточке 2ГИС компания сама указывает гарантию — подтверждено только существование. Конкретный срок не подтверждён.',
  },
  {
    key: 'warranty_terms',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Какой конкретно срок гарантии на конструкции и отдельно на монтаж?',
    note: 'Публикуется только вместе со страницей /oplata-rassrochka.',
  },
  {
    key: 'doors',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Делаете ли вы двери (ПВХ/входные)? Можно ли публиковать страницу «Двери»?',
    note: 'Пока не подтверждено, страница /dveri не создаётся и не попадает в меню и sitemap (§6).',
  },
  {
    key: 'contract_act',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'Работаете по договору с актом выполненных работ?',
    note: 'Упоминается клиентами в отзывах 2ГИС.',
  },
  {
    key: 'working_hours_week',
    textRu: '',
    status: 'unconfirmed',
    source: '2gis',
    questionRu: 'Полный график работы и замеров по дням недели (в 2ГИС виден только один день — пятница, 09:00–18:00, обед 13:00–14:00)?',
    note: 'На сайте показан только подтверждённый день; остальные дни скрыты.',
  },
  {
    key: 'free_measure',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Замер бесплатный? При каких условиях?',
    note: '',
  },
  {
    key: 'measure_speed',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'Как быстро приезжает замерщик? (в отзывах пишут — в день обращения)',
    note: 'Обещать срок нельзя до подтверждения.',
  },
  {
    key: 'service_area',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'В какие районы Караганды и города (Темиртау и другие) вы выезжаете?',
    note: 'В отзывах упоминаются Сортировка, Степной, Новый город; в поисковых запросах — Темиртау.',
  },
  {
    key: 'lead_time_production',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Срок изготовления конструкций?',
    note: '',
  },
  {
    key: 'lead_time_install',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Срок монтажа после изготовления?',
    note: '',
  },
  {
    key: 'brands',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Профили, фурнитура, стеклопакеты: какие бренды можно называть на сайте?',
    note: 'Названия брендов не выдумываем и не публикуем до подтверждения.',
  },
  {
    key: 'price_samples',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Ориентиры цен («от» за м² или по конструкциям) и можно ли их публиковать?',
    note: 'Пока прайса нет, PRICE_DISPLAY=off — цена не показывается ни в интерфейсе, ни в API.',
  },
  {
    key: 'founded_year',
    textRu: '',
    status: 'unconfirmed',
    source: '2gis',
    questionRu: 'С какого года работаете? (в 2ГИС отзывы с 2020 года)',
    note: 'Год основания не публикуем до ответа.',
  },
  {
    key: 'legal_entity',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Юридическое лицо (ТОО/ИП), БИН — публиковать ли в подвале сайта?',
    note: '',
  },
  {
    key: 'workshop',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Адрес цеха совпадает с офисом? Можно ли клиентам приезжать в цех?',
    note: '',
  },
  {
    key: 'team_names',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'Можно ли публиковать имена менеджеров и мастеров, фото команды?',
    note: 'В отзывах клиенты называют сотрудников по именам — публикуем только с согласия.',
  },
  {
    key: 'b2b_terms',
    textRu: '',
    status: 'unconfirmed',
    source: 'reviews',
    questionRu: 'Условия для организаций: договор, безналичный расчёт, акты, объёмы, отсрочка?',
    note: 'Оплата через банк указана в карточке 2ГИС; порядок работы с юрлицами — нет.',
  },
  {
    key: 'brand_assets',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Есть ли логотип, фирменные цвета, фото и видео работ, фото цеха и входа?',
    note: 'До получения материалов используем нейтральные плейсхолдеры.',
  },
  {
    key: 'review_quotes_consent',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Согласны ли публиковать выбранные отзывы из 2ГИС с указанием источника (и есть ли согласие авторов)?',
    note: 'Дословные цитаты появляются только при отметке «согласие получено».',
  },
  {
    key: 'main_whatsapp',
    textRu: '',
    status: 'unconfirmed',
    source: '2gis',
    questionRu: 'Какой номер основной: WhatsApp +7 747 704 33 94 или телефон +7 700 107 49 27? Кто отвечает?',
    note: 'В карточке 2ГИС номер телефона показан частично.',
  },
  {
    key: 'kk_version',
    textRu: '',
    status: 'unconfirmed',
    source: 'none',
    questionRu: 'Нужна ли казахская версия сайта? Есть ли переводчик и человек, который вычитает текст?',
    note: 'Есть отзывы на казахском — казахская версия оправдана (фаза 4).',
  },
];

/** Claims whose confirmation gates a whole page or site section (§6). */
export const PAGE_GATING_CLAIMS = {
  doors: 'doors',
  payment: 'installment_terms',
  balconyServices: 'balcony_services',
  contractAct: 'contract_act',
  freeMeasure: 'free_measure',
} as const;
