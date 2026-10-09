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

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Использование cookie"
      className="fixed inset-x-3 bottom-20 z-50 rounded-xl border border-line bg-surface p-4 shadow-lg md:bottom-4 md:left-4 md:max-w-md"
    >
      <p className="text-sm text-ink">
        Мы используем обязательные cookie для работы сайта. Аналитику и рекламные пиксели подключаем только с вашего
        согласия. Подробнее — в{' '}
        <Link href="/politika" className="font-semibold text-glass underline">
          политике конфиденциальности
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => decide('accepted')} className="btn btn-cta flex-1 py-2 text-sm">
          Разрешить аналитику
        </button>
        <button type="button" onClick={() => decide('declined')} className="btn btn-outline flex-1 py-2 text-sm">
          Только обязательные
        </button>
      </div>
    </div>
  );
}
