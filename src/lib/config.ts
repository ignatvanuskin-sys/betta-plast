/**
 * Runtime configuration.
 *
 * Rules from the master prompt:
 *  - every secret/knob comes from environment variables (never hard-coded);
 *  - contact data and the company name live in config, not in components;
 *  - optional integrations must be disabled gracefully when keys are missing.
 *
 * Nothing here throws at import time: a missing key turns the feature off
 * (or produces a placeholder) instead of breaking the build.
 */

const rawEnv = process.env;

function str(key: string, fallback = ''): string {
  const value = rawEnv[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function bool(key: string, fallback = false): boolean {
  const value = str(key);
  if (value === '') return fallback;
  return value === 'true' || value === '1' || value === 'yes';
}

function int(key: string, fallback: number): number {
  const value = Number.parseInt(str(key), 10);
  return Number.isFinite(value) ? value : fallback;
}

export type PriceDisplayMode = 'off' | 'range';

/**
 * Which database driver to use. A real Postgres URL is preferred; otherwise we
 * fall back to the in-process PGlite database (see lib/db/client.ts).
 */
export const database = {
  url: str('DATABASE_URL'),
  get usesPglite(): boolean {
    return this.url === '' || this.url.startsWith('pglite:');
  },
  /** Filesystem location of the embedded database when DATABASE_URL is absent. */
  pgliteDir: str('PGLITE_DIR', '.data/pglite'),
};

export const site = {
  url: str('SITE_URL', 'http://localhost:3000').replace(/\/+$/, ''),
  timezone: str('DEFAULT_TIMEZONE', 'Asia/Almaty'),
  nodeEnv: str('NODE_ENV', 'development'),
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
};

/** Company identity. Values marked `[УТОЧНИТЬ]` in §2 must be confirmed first. */
export const company = {
  nameRu: 'Бетта Пласт',
  legalNameRu: 'Бетта Пласт — производственно-торговая компания',
  taglineRu: 'Приятные цены на качественные окна. Гарантия. Рассрочка',
  addressRu: 'улица Складская, 8, офис 12, 1 этаж',
  districtRu: 'Казыбек Би район, Караганда',
  cityRu: 'Караганда',
  lat: 49.805239,
  lon: 73.115913,
  transitRu: 'Остановка «Сельхозтехника» — 450 м (5 минут); 1 парковка',
};

export const contacts = {
  phonePrimary: str('PHONE_PRIMARY', '+77001074927'),
  whatsapp: str('WHATSAPP_PRIMARY', '77477043394'),
  email: str('CONTACT_EMAIL', 'betta.plast07@gmail.com'),
  instagramUrl: str('INSTAGRAM_URL', 'https://instagram.com/bettaplast_karaganda'),
  gisFirmUrl: str('GIS_FIRM_URL', 'https://2gis.kz/karaganda/firm/11822477302933245'),
  gisReviewsUrl: str('GIS_REVIEWS_URL', 'https://2gis.kz/karaganda/firm/11822477302933245/tab/reviews'),
  get telHref(): string {
    return `tel:${this.phonePrimary.replace(/[^\d+]/g, '')}`;
  },
  get waHref(): string {
    return `https://wa.me/${this.whatsapp.replace(/\D/g, '')}`;
  },
};

export const telegram = {
  botToken: str('TELEGRAM_BOT_TOKEN'),
  webhookSecret: str('TELEGRAM_WEBHOOK_SECRET'),
  ownerId: str('TELEGRAM_OWNER_ID'),
  leadsChatId: str('TELEGRAM_LEADS_CHAT_ID'),
  get enabled(): boolean {
    return this.botToken !== '';
  },
};

export const email = {
  resendApiKey: str('RESEND_API_KEY'),
  resendFrom: str('RESEND_FROM', str('CONTACT_EMAIL', 'betta.plast07@gmail.com')),
  notifyTo: str('NOTIFY_EMAIL_TO'),
  get enabled(): boolean {
    return this.resendApiKey !== '' && this.notifyTo !== '';
  },
};

export const admin = {
  sessionSecret: str('SESSION_SECRET', 'insecure-dev-secret-change-me'),
  bootstrapEmail: str('ADMIN_BOOTSTRAP_EMAIL'),
  bootstrapPassword: str('ADMIN_BOOTSTRAP_PASSWORD'),
  sessionCookie: 'bp_session',
  sessionTtlHours: int('SESSION_TTL_HOURS', 12),
  get isEphemeralSecret(): boolean {
    return this.sessionSecret === 'insecure-dev-secret-change-me';
  },
};

export const cron = {
  secret: str('CRON_SECRET'),
};

export const antiSpam = {
  turnstileSiteKey: str('TURNSTILE_SITE_KEY'),
  turnstileSecretKey: str('TURNSTILE_SECRET_KEY'),
  get turnstileEnabled(): boolean {
    return this.turnstileSecretKey !== '';
  },
  rateLimitPerHourPerIp: int('RATE_LIMIT_PER_IP_HOUR', 10),
  rateLimitPerHourPerPhone: int('RATE_LIMIT_PER_PHONE_HOUR', 5),
};

export const analytics = {
  ymCounterId: str('YM_COUNTER_ID'),
  ga4Id: str('GA4_ID'),
  metaPixelId: str('META_PIXEL_ID'),
  get anyEnabled(): boolean {
    return this.ymCounterId !== '' || this.ga4Id !== '' || this.metaPixelId !== '';
  },
};

export const flags = {
  priceDisplay: (str('PRICE_DISPLAY', 'off') === 'range' ? 'range' : 'off') as PriceDisplayMode,
  kkEnabled: bool('KK_ENABLED', false),
  aiAssistantEnabled: bool('AI_ASSISTANT_ENABLED', false),
  orderStatusPageEnabled: bool('ORDER_STATUS_PAGE_ENABLED', false),
  slaFirstResponseMinutes: int('SLA_FIRST_RESPONSE_MINUTES', 10),
};

export const storage = {
  blobToken: str('BLOB_READ_WRITE_TOKEN'),
  s3Endpoint: str('S3_ENDPOINT'),
  s3Bucket: str('S3_BUCKET'),
  s3KeyId: str('S3_ACCESS_KEY_ID'),
  s3Secret: str('S3_SECRET_ACCESS_KEY'),
  localDir: str('LOCAL_STORAGE_DIR', 'storage'),
  get remoteEnabled(): boolean {
    return this.s3Endpoint !== '' && this.s3Bucket !== '';
  },
};

/** Working hours used before the owner confirms the full weekly schedule. */
export const defaultWorkingHours = {
  /** 0 = Sunday … 6 = Saturday. Only Friday is documented in the 2GIS card. */
  schedule: [
    { weekday: 1, startMinute: 9 * 60, endMinute: 18 * 60, enabled: true },
    { weekday: 2, startMinute: 9 * 60, endMinute: 18 * 60, enabled: true },
    { weekday: 3, startMinute: 9 * 60, endMinute: 18 * 60, enabled: true },
    { weekday: 4, startMinute: 9 * 60, endMinute: 18 * 60, enabled: true },
    { weekday: 5, startMinute: 9 * 60, endMinute: 18 * 60, enabled: true },
    { weekday: 6, startMinute: 10 * 60, endMinute: 15 * 60, enabled: false },
    { weekday: 0, startMinute: 10 * 60, endMinute: 15 * 60, enabled: false },
  ],
  lunchStartMinute: 13 * 60,
  lunchEndMinute: 14 * 60,
};

/**
 * Reports configuration gaps for the owner. Surfaced in the admin dashboard and
 * in docs/QA.md rather than in the public UI.
 */
export function configurationWarnings(): string[] {
  const warnings: string[] = [];
  if (admin.isEphemeralSecret) warnings.push('SESSION_SECRET не задан — используется небезопасное значение по умолчанию.');
  if (!telegram.enabled) warnings.push('TELEGRAM_BOT_TOKEN не задан — уведомления в Telegram отключены.');
  if (telegram.enabled && telegram.leadsChatId === '') warnings.push('TELEGRAM_LEADS_CHAT_ID не задан — карточки заявок некуда отправлять.');
  if (telegram.enabled && telegram.ownerId === '') warnings.push('TELEGRAM_OWNER_ID не задан — эскалация владельцу работать не будет.');
  if (!email.enabled) warnings.push('RESEND_API_KEY / NOTIFY_EMAIL_TO не заданы — запасной канал email отключён.');
  if (cron.secret === '') warnings.push('CRON_SECRET не задан — защищённые cron-эндпоинты недоступны.');
  if (database.usesPglite) warnings.push('DATABASE_URL не задан — используется встроенная PGlite (только для разработки/демо).');
  if (flags.priceDisplay === 'range') warnings.push('PRICE_DISPLAY=range — убедитесь, что прайс подтверждён владельцем.');
  return warnings;
}
