import Link from 'next/link';

import { IconClock, IconMail, IconPhone, IconPin } from './icons';
import { TrackedLink } from './TrackedLink';
import { company, contacts, defaultWorkingHours, flags } from '@/lib/config';
import { ratingLine, getRating } from '@/lib/domain/settings';

export type FooterLink = { href: string; label: string };

function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Footer. Legal entity details are printed only when the owner has allowed it
 * (§7.1) — the registry decides, not this component.
 */
export async function SiteFooter({ pages, legalEntity }: { pages: FooterLink[]; legalEntity?: string | null }) {
  const rating = await getRating();
  const friday = defaultWorkingHours.schedule.find((entry) => entry.weekday === 5);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{company.nameRu}</p>
          <p className="hint mt-1">{company.taglineRu}</p>
          <p className="mt-4 text-sm text-ink-soft">{ratingLine(rating)}</p>
          <a
            href={contacts.gisReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-glass underline"
          >
            Все отзывы в 2ГИС
          </a>
        </div>

        <div>
          <p className="font-semibold">Контакты</p>
          <ul className="mt-3 space-y-3 text-sm text-ink-soft">
            <li className="flex items-start gap-2">
              <IconPin size={18} className="mt-0.5 shrink-0 text-glass" />
              <span>
                {company.addressRu}
                <br />
                {company.districtRu}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <IconPhone size={18} className="shrink-0 text-glass" />
              <TrackedLink href={contacts.telHref} event="call_click" props={{ place: 'footer' }} className="font-medium">
                {contacts.phonePrimary}
              </TrackedLink>
            </li>
            <li className="flex items-center gap-2">
              <IconMail size={18} className="shrink-0 text-glass" />
              <a href={`mailto:${contacts.email}`} className="font-medium">
                {contacts.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <IconClock size={18} className="mt-0.5 shrink-0 text-glass" />
              <span>
                {friday ? <>Пятница: {formatMinutes(friday.startMinute)}–{formatMinutes(friday.endMinute)}</> : null}
                <br />
                <span className="hint">
                  Полный график по дням недели уточняйте у менеджера
                </span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">Разделы</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {pages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-ink-soft hover:text-glass">
                  {page.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={contacts.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-glass">
                Instagram
              </a>
            </li>
            <li>
              <a href={contacts.gisFirmUrl} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-glass">
                2ГИС
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {company.nameRu}. Караганда.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Цены и условия — по запросу у менеджера{flags.priceDisplay === 'off' ? '' : ' либо ориентировочно после замера'}.</span>
          </p>
          {legalEntity ? <p>{legalEntity}</p> : null}
        </div>
      </div>
    </footer>
  );
}
