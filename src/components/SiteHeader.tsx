'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IconPhone } from './icons';
import { TrackedLink } from './TrackedLink';

export type NavItem = { href: string; label: string };

/**
 * Fixed 69px header, matching the reference arrangement:
 * compact two-line wordmark · up to six single-line nav items · phone pill ·
 * filled WhatsApp button.
 *
 * The header shows a short curated nav only — putting all 13 routes here made
 * the items wrap onto three lines and clip at 1440px. The complete list lives
 * in the mobile sheet and the footer.
 */
export function SiteHeader({
  primaryNav,
  allNav,
  phone,
  waHref,
}: {
  primaryNav: NavItem[];
  allNav: NavItem[];
  phone: string;
  waHref: string;
}) {
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
      <div className="container-page flex h-[69px] flex-nowrap items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Бетта Пласт — на главную">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
              <path d="M12 3.5v17M3.5 12h17" />
            </svg>
          </span>
          <span className="shrink-0 leading-none">
            <span className="block whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">
              Бетта Пласт
            </span>
            <span className="mt-1 block whitespace-nowrap text-[9px] font-normal uppercase tracking-[0.16em] text-muted-fg">
              окна и конструкции
            </span>
          </span>
        </Link>

        <nav className="hidden flex-nowrap items-center gap-1 lg:flex" aria-label="Основная навигация">
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[15px] transition-colors ${
                  active ? 'text-primary' : 'text-ink-soft hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <TrackedLink
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            event="call_click"
            props={{ place: 'header' }}
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/45 xl:inline-flex"
          >
            <IconPhone size={16} />
            {phone}
          </TrackedLink>
          <TrackedLink
            href={waHref}
            event="whatsapp_click"
            props={{ place: 'header' }}
            className="btn btn-green btn-sheen hidden shrink-0 !min-h-10 !px-4 !text-[13px] whitespace-nowrap md:inline-flex"
          >
            Написать в WhatsApp
          </TrackedLink>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-[69px] bottom-0 z-40 overflow-y-auto bg-bg lg:hidden">
          <nav className="container-page flex flex-col gap-0.5 py-6" aria-label="Мобильная навигация">
            {allNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-13 items-center border-b border-line/70 py-3 text-base font-medium text-primary"
              >
                {item.label}
              </Link>
            ))}
            <TrackedLink
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              event="call_click"
              props={{ place: 'mobile_menu' }}
              className="mt-5 flex min-h-12 items-center gap-3 text-lg font-medium text-primary"
            >
              <IconPhone size={20} />
              {phone}
            </TrackedLink>
            <TrackedLink
              href={waHref}
              event="whatsapp_click"
              props={{ place: 'mobile_menu' }}
              className="btn btn-green btn-sheen mt-2"
            >
              Написать в WhatsApp
            </TrackedLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
