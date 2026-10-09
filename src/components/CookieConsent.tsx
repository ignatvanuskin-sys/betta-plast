'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const CONSENT_STORAGE_KEY = 'bp_cookie_consent';

/**
 * Cookie banner (§14): only essential cookies are used before consent, and
 * analytics/pixels are loaded strictly afterwards.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const decide = (value: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('bp:consent', { detail: value }));
    setVisible(false);
  };

  // Both the banner and the mobile action bar are fixed to the bottom edge, so
  // they would stack on top of each other. The banner broadcasts its state and
  // the bar stays out of the way while it is open.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bp:cookie-banner', { detail: visible }));
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Использование cookie"
      className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-line bg-surface/97 p-3.5 shadow-[0_8px_30px_rgba(11,26,22,0.16)] backdrop-blur-sm lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-sm"
    >
      <p className="text-[13px] leading-snug text-ink-soft">
        Обязательные cookie — для работы сайта. Аналитику подключаем только с вашего согласия.{' '}
        <Link href="/politika" className="font-medium text-primary underline">
          Подробнее
        </Link>
      </p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => decide('accepted')}
          className="min-h-9 flex-1 rounded-full bg-primary px-3 text-[13px] font-medium text-primary-fg"
        >
          Разрешить
        </button>
        <button
          type="button"
          onClick={() => decide('declined')}
          className="min-h-9 flex-1 rounded-full border border-primary/25 px-3 text-[13px] font-medium text-primary"
        >
          Только обязательные
        </button>
      </div>
    </div>
  );
}
