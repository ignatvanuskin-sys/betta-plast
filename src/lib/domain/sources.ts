/**
 * Lead attribution (§8.6).
 *
 * Priority: explicit `src` → UTM (utm_source/utm_medium) → referrer host →
 * `direct`.
 */

export const LEAD_SOURCES = ['2gis', 'instagram', 'whatsapp', 'search', 'qr', 'direct', 'other'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const SOURCE_LABELS_RU: Record<LeadSource, string> = {
  '2gis': '2ГИС',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  search: 'Поиск',
  qr: 'QR-код',
  direct: 'Прямой заход',
  other: 'Другое',
};

const SRC_ALIASES: Record<string, LeadSource> = {
  '2gis': '2gis',
  twogis: '2gis',
  gis: '2gis',
  instagram: 'instagram',
  ig: 'instagram',
  whatsapp: 'whatsapp',
  wa: 'whatsapp',
  google: 'search',
  yandex: 'search',
  search: 'search',
  qr: 'qr',
  'qr-zamer': 'qr',
  'qr-ceh': 'qr',
  'qr-vizitka': 'qr',
  direct: 'direct',
};

export type AttributionInput = {
  src?: string | null;
  utm?: Record<string, string> | null;
  referrer?: string | null;
};

export function resolveSource(input: AttributionInput): LeadSource {
  const src = (input.src ?? '').trim().toLowerCase();
  if (src && SRC_ALIASES[src]) return SRC_ALIASES[src];

  const utm = input.utm ?? {};
  const utmSource = (utm.utm_source ?? utm.source ?? '').trim().toLowerCase();
  if (utmSource && SRC_ALIASES[utmSource]) return SRC_ALIASES[utmSource];

  const referrer = (input.referrer ?? '').trim().toLowerCase();
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '');
      if (host.includes('2gis')) return '2gis';
      if (host.includes('instagram')) return 'instagram';
      if (host.includes('wa.me') || host.includes('whatsapp')) return 'whatsapp';
      if (host.includes('google.') || host.includes('yandex.')) return 'search';
    } catch {
      // ignore malformed referrers
    }
  }

  return 'direct';
}

/** Query-string parameters kept with every lead. */
export const TRACKED_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'src',
  'gclid',
  'yclid',
] as const;

export function pickUtm(params: URLSearchParams): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const key of TRACKED_UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 200);
  }
  return utm;
}
