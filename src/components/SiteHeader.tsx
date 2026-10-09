'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IconPhone, IconWhatsapp } from './icons';
import { TrackedLink } from './TrackedLink';

export type NavItem = { href: string; label: string };

/**
 * Header. On mobile it collapses into a sheet; the phone number stays visible
 * at all times because calling is the cheapest conversion (§4).
 */
export function SiteHeader({ nav, phone, waHref }: { nav: NavItem[]; phone: string; waHref: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold" aria-label="Бетта Пласт — на главную">
          <span className="flex h-9 w-9 items-center justify-center rounded border-[1.5px] border-glass text-glass">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
              <path d="M12 3.5v17M3.5 12h17" />
            </svg>
          </span>
          <span className="leading-tight">
            Бетта Пласт
            <span className="block text-xs font-medium text-muted">окна и балконы, Караганда</span>
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
                className={`rounded px-3 py-2 text-sm font-medium ${
                  active ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:text-glass'
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
            className="hidden items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-ink sm:flex"
          >
            <IconPhone size={18} />
            {phone}
          </TrackedLink>
          <TrackedLink href={waHref} event="whatsapp_click" className="btn btn-wa hidden px-3 py-2 text-sm md:inline-flex">
            <IconWhatsapp size={18} />
            WhatsApp
          </TrackedLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 items-center justify-center rounded border border-line lg:hidden"
          >
            <span className="sr-only">{open ? 'Закрыть меню' : 'Открыть меню'}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-surface lg:hidden">
          <nav className="container-page grid gap-1 py-3" aria-label="Мобильная навигация">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded px-3 py-2 text-base font-medium text-ink hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
