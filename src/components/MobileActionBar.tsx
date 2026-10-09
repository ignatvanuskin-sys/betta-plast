'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { IconCalculator, IconPhone, IconWhatsapp } from './icons';
import { trackEventClient } from '@/lib/client/analytics';

/**
 * Fixed bottom bar with the three primary actions (§4). Hidden while the
 * on-screen keyboard is open so it never covers the form fields it points to.
 */
export function MobileActionBar({ phone, waHref }: { phone: string; waHref: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isField = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tag = element.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isField(event.target)) setHidden(true);
    };
    const onFocusOut = () => setHidden(false);

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/98 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-3">
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          onClick={() => trackEventClient('call_click', { place: 'mobile_bar' })}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-ink"
        >
          <IconPhone size={22} />
          Позвонить
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEventClient('whatsapp_click', { place: 'mobile_bar' })}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 border-x border-line text-xs font-semibold text-[#1f8f4e]"
        >
          <IconWhatsapp size={22} />
          WhatsApp
        </a>
        <Link
          href="/raschet"
          onClick={() => trackEventClient('calc_start', { place: 'mobile_bar' })}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 bg-cta text-xs font-semibold text-white"
        >
          <IconCalculator size={22} />
          Рассчитать
        </Link>
      </div>
    </div>
  );
}
