'use client';

/**
 * Client-side attribution and event reporting (§8.6).
 *
 * Attribution is captured on first landing (so a visitor who came from the 2GIS
 * card and then browsed three pages is still attributed to 2GIS) and is sent
 * with every lead. Events are posted with `sendBeacon`, which survives the page
 * unload that follows a `tel:` or `wa.me` click.
 */

const ATTR_KEY = 'bp_attr';
const SESSION_KEY = 'bp_session';

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

export type Attribution = {
  src?: string;
  utm: Record<string, string>;
  referrer?: string;
  landingPath?: string;
  capturedAt: string;
};

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Captures attribution from the current URL, once per session. */
export function captureAttribution(): Attribution {
  const empty: Attribution = { utm: {}, capturedAt: new Date().toISOString() };
  if (typeof window === 'undefined') return empty;

  const stored = window.sessionStorage.getItem(ATTR_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      // fall through and recapture
    }
  }

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of TRACKED_UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 200);
  }

  const attribution: Attribution = {
    src: params.get('src') ?? utm.src ?? undefined,
    utm,
    referrer: document.referrer || undefined,
    landingPath: window.location.pathname + window.location.search,
    capturedAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(attribution));
  return attribution;
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { utm: {}, capturedAt: new Date().toISOString() };
  const stored = window.sessionStorage.getItem(ATTR_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      // ignore
    }
  }
  return captureAttribution();
}

export function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

/** Reports a site event. Never throws and never blocks navigation. */
export function trackEventClient(name: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    name,
    path: window.location.pathname,
    sessionId: getSessionId(),
    props: props ?? {},
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true });
    }
  } catch {
    // analytics must never break the page
  }
}
