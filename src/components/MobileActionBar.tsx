'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { IconCalendar, IconWhatsapp } from './icons';
import { trackEventClient } from '@/lib/client/analytics';

/**
 * Floating mobile action bar in the reference style: a dark-green rounded
 * card 12px from the edges, holding the two actions that actually convert —
 * booking a measurement and WhatsApp.
 *
 * Hidden while a form field has focus so the on-screen keyboard never covers
 * the input the visitor is filling in, and hidden from `lg` upward.
 */
export function MobileActionBar({ waHref }: { waHref: string }) {
  const [hidden, setHidden] = useState(false);
  /* The bar stays out of the way of the hero and appears once the visitor has
     scrolled past it — same behaviour as the reference, and it stops the bar
     from sitting on top of the first screen's content. */
  const [scrolledPast, setScrolledPast] = useState(false);

  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Yield to the cookie banner — otherwise both fixed bars occupy the same strip.
  useEffect(() => {
    const onBanner = (event: Event) => setBannerOpen(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('bp:cookie-banner', onBanner);
    return () => window.removeEventListener('bp:cookie-banner', onBanner);
  }, []);

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

  if (hidden || !scrolledPast || bannerOpen) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-2 gap-2 rounded-2xl border border-white/60 bg-primary/95 p-2 shadow-[0_12px_40px_rgba(11,26,22,0.35)] backdrop-blur lg:hidden"
    >
      <Link
        href="/zamer"
        onClick={() => trackEventClient('measure_request', { place: 'mobile_bar' })}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-primary"
      >
        <IconCalendar size={17} />
        Запись на замер
      </Link>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEventClient('whatsapp_click', { place: 'mobile_bar' })}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-semibold text-on-gold"
      >
        <IconWhatsapp size={17} />
        WhatsApp
      </a>
    </div>
  );
}
