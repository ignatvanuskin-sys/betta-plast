'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IconPhone, IconWhatsapp } from './icons';
import { TrackedLink } from './TrackedLink';

export type NavItem = { href: string; label: string };

/**
 * Fixed header in the reference style: 69px tall, sand background at 92% with a
 * backdrop blur and a hairline bottom border. Elevation appears only after the
 * page is scrolled, so the hero stays completely flat.
 */
export function SiteHeader({ nav, phone, waHref }: { nav: NavItem[]; phone: string; waHref: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-bg/92 backdrop-blur-md transition-shadow ${
        scrolled ? 'shadow-[0_1px_24px_rgba(11,26,22,0.08)]' : ''
      }`}
    >
      <div className="container-page flex h-[69px] items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-primary"
          aria-label="Бетта Пласт — на главную"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
              <path d="M12 3.5v17M3.5 12h17" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">Бетта Пласт</span>
            <span className="block text-[11px] font-normal tracking-wide text-muted-fg">окна · балконы · Караганда</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-2 text-[15px] transition-colors ${
                  active ? 'text-primary' : 'text-ink-soft hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <TrackedLink
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            event="call_click"
            className="hidden items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/45 xl:inline-flex"
          >
            <IconPhone size={16} />
            {phone}
          </TrackedLink>
          <TrackedLink
            href={waHref}
            event="whatsapp_click"
            className="btn btn-gold btn-sheen hidden !min-h-10 !px-4 !text-[13px] md:inline-flex"
          >
            <IconWhatsapp size={16} />
            WhatsApp
          </TrackedLink>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 text-primary lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-[69px] bottom-0 z-40 overflow-y-auto bg-bg lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-6" aria-label="Мобильная навигация">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 items-center border-b border-line/70 text-lg font-medium text-primary"
              >
                {item.label}
              </Link>
            ))}
            <TrackedLink
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              event="call_click"
              className="mt-4 flex min-h-12 items-center gap-3 text-lg font-medium text-primary"
            >
              <IconPhone size={20} />
              {phone}
            </TrackedLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
